from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta

from app.core.exceptions import DashboardNotFoundError
from app.core.utils.time import to_utc_naive, utcnow
from app.db.models import StickySessionKind
from app.modules.proxy.service import LiveCodexBridgeSessionSnapshot
from app.modules.proxy.sticky_repository import StickySessionListEntryRecord, StickySessionsRepository
from app.modules.settings.repository import SettingsRepository


@dataclass(frozen=True, slots=True)
class StickySessionEntryData:
    key: str
    account_id: str
    display_name: str
    kind: StickySessionKind
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None
    is_stale: bool


@dataclass(frozen=True, slots=True)
class StickySessionListData:
    entries: list[StickySessionEntryData]
    stale_prompt_cache_count: int
    total: int
    has_more: bool


@dataclass(frozen=True, slots=True)
class CurrentCodexSessionData:
    key: str
    account_id: str
    display_name: str
    kind: StickySessionKind
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None
    is_stale: bool
    turn_state: str | None
    live_bridge_connected: bool


@dataclass(frozen=True, slots=True)
class CurrentCodexSessionUsageData:
    current: CurrentCodexSessionData | None
    other_sessions_using_account: list[StickySessionEntryData]


class StickySessionsService:
    def __init__(
        self,
        repository: StickySessionsRepository,
        settings_repository: SettingsRepository,
    ) -> None:
        self._repository = repository
        self._settings_repository = settings_repository

    async def list_entries(
        self,
        *,
        kind: StickySessionKind | None = None,
        stale_only: bool = False,
        offset: int = 0,
        limit: int = 100,
    ) -> StickySessionListData:
        settings = await self._settings_repository.get_or_create()
        ttl_seconds = settings.openai_cache_affinity_max_age_seconds
        stale_cutoff = utcnow() - timedelta(seconds=ttl_seconds)
        stale_prompt_cache_count = await self._count_stale_prompt_cache_entries(kind=kind, stale_cutoff=stale_cutoff)
        if stale_only and kind not in (None, StickySessionKind.PROMPT_CACHE):
            return StickySessionListData(
                entries=[],
                stale_prompt_cache_count=stale_prompt_cache_count,
                total=0,
                has_more=False,
            )
        effective_kind = StickySessionKind.PROMPT_CACHE if stale_only else kind
        total = await self._repository.count_entries(
            kind=effective_kind,
            updated_before=stale_cutoff if stale_only else None,
        )
        rows = await self._repository.list_entries(
            kind=effective_kind,
            updated_before=stale_cutoff if stale_only else None,
            offset=offset,
            limit=limit,
        )
        entries = [self._to_entry(row, ttl_seconds=ttl_seconds) for row in rows]
        return StickySessionListData(
            entries=entries,
            stale_prompt_cache_count=stale_prompt_cache_count,
            total=total,
            has_more=offset + len(entries) < total,
        )

    async def delete_entry(self, key: str, *, kind: StickySessionKind) -> bool:
        return await self._repository.delete(key, kind=kind)

    async def create_entry(
        self,
        key: str,
        *,
        kind: StickySessionKind,
        account_id: str,
    ) -> StickySessionEntryData:
        account = await self._repository.get_account(account_id)
        if account is None:
            raise DashboardNotFoundError("Account not found", code="account_not_found")
        settings = await self._settings_repository.get_or_create()
        ttl_seconds = settings.openai_cache_affinity_max_age_seconds
        await self._repository.upsert(key, account.id, kind=kind)
        row = await self._repository.get_entry_record(key, kind=kind)
        if row is None:
            raise RuntimeError(f"Sticky session lookup failed for key={key!r} kind={kind.value!r}")
        return self._to_entry(row, ttl_seconds=ttl_seconds)

    async def purge_entries(self) -> int:
        settings = await self._settings_repository.get_or_create()
        cutoff = utcnow() - timedelta(seconds=settings.openai_cache_affinity_max_age_seconds)
        return await self._repository.purge_prompt_cache_before(cutoff)

    async def get_current_codex_session_usage(
        self,
        *,
        live_codex_sessions: Sequence[LiveCodexBridgeSessionSnapshot],
    ) -> CurrentCodexSessionUsageData:
        settings = await self._settings_repository.get_or_create()
        rows = await self._repository.list_entries(kind=StickySessionKind.CODEX_SESSION, offset=0, limit=None)
        if not rows:
            return CurrentCodexSessionUsageData(current=None, other_sessions_using_account=[])

        entries = [
            self._to_entry(row, ttl_seconds=settings.openai_cache_affinity_max_age_seconds)
            for row in rows
        ]
        current_entry = entries[0]
        live_session = next(
            (
                snapshot
                for snapshot in live_codex_sessions
                if self._live_codex_session_matches_key(snapshot, current_entry.key)
            ),
            None,
        )
        current = CurrentCodexSessionData(
            key=current_entry.key,
            account_id=current_entry.account_id,
            display_name=current_entry.display_name,
            kind=current_entry.kind,
            created_at=current_entry.created_at,
            updated_at=current_entry.updated_at,
            expires_at=current_entry.expires_at,
            is_stale=current_entry.is_stale,
            turn_state=(
                live_session.downstream_turn_state or live_session.upstream_turn_state
                if live_session is not None
                else None
            ),
            live_bridge_connected=live_session is not None,
        )
        other_sessions_using_account = [
            entry
            for entry in entries[1:]
            if entry.account_id == current_entry.account_id
        ]
        return CurrentCodexSessionUsageData(
            current=current,
            other_sessions_using_account=other_sessions_using_account,
        )

    def _to_entry(self, row: StickySessionListEntryRecord, *, ttl_seconds: int) -> StickySessionEntryData:
        sticky_session = row.sticky_session
        expires_at: datetime | None = None
        is_stale = False
        if sticky_session.kind == StickySessionKind.PROMPT_CACHE:
            expires_at = to_utc_naive(sticky_session.updated_at) + timedelta(seconds=ttl_seconds)
            is_stale = expires_at <= utcnow()
        return StickySessionEntryData(
            key=sticky_session.key,
            account_id=sticky_session.account_id,
            display_name=row.display_name,
            kind=sticky_session.kind,
            created_at=sticky_session.created_at,
            updated_at=sticky_session.updated_at,
            expires_at=expires_at,
            is_stale=is_stale,
        )

    @staticmethod
    def _live_codex_session_matches_key(snapshot: LiveCodexBridgeSessionSnapshot, key: str) -> bool:
        return (
            snapshot.affinity_key == key
            or snapshot.downstream_turn_state == key
            or snapshot.upstream_turn_state == key
            or key in snapshot.turn_state_aliases
        )

    async def _count_stale_prompt_cache_entries(
        self,
        *,
        kind: StickySessionKind | None,
        stale_cutoff: datetime,
    ) -> int:
        if kind not in (None, StickySessionKind.PROMPT_CACHE):
            return 0
        return await self._repository.count_entries(
            kind=StickySessionKind.PROMPT_CACHE,
            updated_before=stale_cutoff,
        )
