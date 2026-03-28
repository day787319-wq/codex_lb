from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock
from urllib.parse import quote

import pytest
from sqlalchemy import text

from app.dependencies import get_proxy_service_for_app
from app.core.crypto import TokenEncryptor
from app.core.utils.time import utcnow
from app.db.models import Account, AccountStatus, StickySessionKind
from app.db.session import SessionLocal
from app.modules.accounts.repository import AccountsRepository
from app.modules.proxy.service import LiveCodexBridgeSessionSnapshot
from app.modules.settings.repository import SettingsRepository
from app.modules.sticky_sessions.cleanup_scheduler import StickySessionCleanupScheduler

pytestmark = pytest.mark.integration


async def _create_accounts() -> list[Account]:
    encryptor = TokenEncryptor()
    accounts = [
        Account(
            id="sticky-api-a",
            chatgpt_account_id="sticky-api-a",
            email="sticky-a@example.com",
            plan_type="plus",
            access_token_encrypted=encryptor.encrypt("access-a"),
            refresh_token_encrypted=encryptor.encrypt("refresh-a"),
            id_token_encrypted=encryptor.encrypt("id-a"),
            last_refresh=utcnow(),
            status=AccountStatus.ACTIVE,
            deactivation_reason=None,
        ),
        Account(
            id="sticky-api-b",
            chatgpt_account_id="sticky-api-b",
            email="sticky-b@example.com",
            plan_type="plus",
            access_token_encrypted=encryptor.encrypt("access-b"),
            refresh_token_encrypted=encryptor.encrypt("refresh-b"),
            id_token_encrypted=encryptor.encrypt("id-b"),
            last_refresh=utcnow(),
            status=AccountStatus.ACTIVE,
            deactivation_reason=None,
        ),
    ]
    async with SessionLocal() as session:
        repo = AccountsRepository(session)
        for account in accounts:
            await repo.upsert(account)
    return accounts


async def _set_affinity_ttl(seconds: int) -> None:
    async with SessionLocal() as session:
        settings = await SettingsRepository(session).get_or_create()
        settings.openai_cache_affinity_max_age_seconds = seconds
        await session.commit()


async def _insert_sticky_session(
    *,
    key: str,
    account_id: str,
    kind: StickySessionKind,
    updated_at_offset_seconds: int,
) -> None:
    timestamp = utcnow() - timedelta(seconds=updated_at_offset_seconds)
    async with SessionLocal() as session:
        await session.execute(
            text(
                """
                INSERT INTO sticky_sessions (key, account_id, kind, created_at, updated_at)
                VALUES (:key, :account_id, :kind, :timestamp, :timestamp)
                """
            ),
            {
                "key": key,
                "account_id": account_id,
                "kind": kind.value,
                "timestamp": timestamp,
            },
        )
        await session.commit()


@pytest.mark.asyncio
async def test_sticky_sessions_api_lists_metadata_and_purges_stale(async_client):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)
    await _insert_sticky_session(
        key="prompt-cache-stale",
        account_id=accounts[0].id,
        kind=StickySessionKind.PROMPT_CACHE,
        updated_at_offset_seconds=600,
    )
    await _insert_sticky_session(
        key="prompt-cache-fresh",
        account_id=accounts[0].id,
        kind=StickySessionKind.PROMPT_CACHE,
        updated_at_offset_seconds=10,
    )
    await _insert_sticky_session(
        key="codex-session-old",
        account_id=accounts[1].id,
        kind=StickySessionKind.CODEX_SESSION,
        updated_at_offset_seconds=600,
    )

    response = await async_client.get("/api/sticky-sessions")
    assert response.status_code == 200
    payload = response.json()
    entries = {entry["key"]: entry for entry in payload["entries"]}
    assert payload["total"] == 3
    assert payload["hasMore"] is False

    assert entries["prompt-cache-stale"]["kind"] == "prompt_cache"
    assert entries["prompt-cache-stale"]["accountId"] == accounts[0].id
    assert entries["prompt-cache-stale"]["displayName"] == "sticky-a@example.com"
    assert entries["prompt-cache-stale"]["isStale"] is True
    assert entries["prompt-cache-stale"]["expiresAt"] is not None
    assert entries["prompt-cache-fresh"]["accountId"] == accounts[0].id
    assert entries["prompt-cache-fresh"]["displayName"] == "sticky-a@example.com"
    assert entries["prompt-cache-fresh"]["isStale"] is False
    assert entries["codex-session-old"]["kind"] == "codex_session"
    assert entries["codex-session-old"]["accountId"] == accounts[1].id
    assert entries["codex-session-old"]["displayName"] == "sticky-b@example.com"
    assert entries["codex-session-old"]["isStale"] is False
    assert entries["codex-session-old"]["expiresAt"] is None

    response = await async_client.get("/api/sticky-sessions", params={"staleOnly": "true"})
    assert response.status_code == 200
    stale_payload = response.json()
    assert [entry["key"] for entry in stale_payload["entries"]] == ["prompt-cache-stale"]
    assert stale_payload["total"] == 1
    assert stale_payload["hasMore"] is False

    response = await async_client.post("/api/sticky-sessions/purge", json={"staleOnly": True})
    assert response.status_code == 200
    assert response.json()["deletedCount"] == 1

    response = await async_client.get("/api/sticky-sessions")
    assert response.status_code == 200
    remaining_keys = {entry["key"] for entry in response.json()["entries"]}
    assert remaining_keys == {"prompt-cache-fresh", "codex-session-old"}


@pytest.mark.asyncio
async def test_sticky_sessions_api_reports_current_codex_session_usage(async_client, app_instance, monkeypatch):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)
    await _insert_sticky_session(
        key="current-session",
        account_id=accounts[0].id,
        kind=StickySessionKind.CODEX_SESSION,
        updated_at_offset_seconds=5,
    )
    await _insert_sticky_session(
        key="other-session",
        account_id=accounts[0].id,
        kind=StickySessionKind.CODEX_SESSION,
        updated_at_offset_seconds=20,
    )
    await _insert_sticky_session(
        key="different-account-session",
        account_id=accounts[1].id,
        kind=StickySessionKind.CODEX_SESSION,
        updated_at_offset_seconds=40,
    )

    proxy_service = get_proxy_service_for_app(app_instance)
    monkeypatch.setattr(
        proxy_service,
        "list_live_codex_bridge_sessions",
        AsyncMock(
            return_value=[
                LiveCodexBridgeSessionSnapshot(
                    account_id=accounts[0].id,
                    affinity_key="current-session",
                    affinity_kind="session_header",
                    downstream_turn_state="http_turn_current",
                    upstream_turn_state="upstream_turn_current",
                    turn_state_aliases=("http_turn_current",),
                )
            ]
        ),
    )

    response = await async_client.get("/api/sticky-sessions/current-codex-session")
    assert response.status_code == 200
    payload = response.json()

    assert payload["current"]["key"] == "current-session"
    assert payload["current"]["accountId"] == accounts[0].id
    assert payload["current"]["displayName"] == "sticky-a@example.com"
    assert payload["current"]["turnState"] == "http_turn_current"
    assert payload["current"]["liveBridgeConnected"] is True
    assert [(entry["key"], entry["accountId"]) for entry in payload["otherSessionsUsingAccount"]] == [
        ("other-session", accounts[0].id)
    ]


@pytest.mark.asyncio
async def test_sticky_sessions_api_reports_current_codex_session_without_live_bridge(
    async_client,
    app_instance,
    monkeypatch,
):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)
    await _insert_sticky_session(
        key="current-session",
        account_id=accounts[0].id,
        kind=StickySessionKind.CODEX_SESSION,
        updated_at_offset_seconds=5,
    )

    proxy_service = get_proxy_service_for_app(app_instance)
    monkeypatch.setattr(
        proxy_service,
        "list_live_codex_bridge_sessions",
        AsyncMock(return_value=[]),
    )

    response = await async_client.get("/api/sticky-sessions/current-codex-session")
    assert response.status_code == 200
    payload = response.json()

    assert payload["current"]["key"] == "current-session"
    assert payload["current"]["turnState"] is None
    assert payload["current"]["liveBridgeConnected"] is False
    assert payload["otherSessionsUsingAccount"] == []


@pytest.mark.asyncio
async def test_sticky_sessions_api_creates_and_replaces_manual_mapping(async_client):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)

    response = await async_client.post(
        "/api/sticky-sessions",
        json={
            "key": " manual-codex-session ",
            "kind": "codex_session",
            "accountId": accounts[0].id,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "saved"
    assert payload["entry"]["key"] == "manual-codex-session"
    assert payload["entry"]["kind"] == "codex_session"
    assert payload["entry"]["accountId"] == accounts[0].id
    assert payload["entry"]["displayName"] == "sticky-a@example.com"
    assert payload["entry"]["isStale"] is False
    assert payload["entry"]["expiresAt"] is None

    response = await async_client.post(
        "/api/sticky-sessions",
        json={
            "key": "manual-codex-session",
            "kind": "codex_session",
            "accountId": accounts[1].id,
        },
    )
    assert response.status_code == 200
    replaced = response.json()
    assert replaced["entry"]["accountId"] == accounts[1].id
    assert replaced["entry"]["displayName"] == "sticky-b@example.com"

    response = await async_client.get("/api/sticky-sessions")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert [(entry["key"], entry["kind"], entry["accountId"], entry["displayName"]) for entry in payload["entries"]] == [
        ("manual-codex-session", "codex_session", accounts[1].id, "sticky-b@example.com")
    ]


@pytest.mark.asyncio
async def test_sticky_sessions_api_rejects_manual_mapping_for_unknown_account(async_client):
    await _create_accounts()

    response = await async_client.post(
        "/api/sticky-sessions",
        json={
            "key": "missing-account-session",
            "kind": "codex_session",
            "accountId": "missing-account-id",
        },
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "account_not_found"


@pytest.mark.asyncio
async def test_sticky_sessions_api_rejects_non_stale_purge_requests(async_client):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)
    await _insert_sticky_session(
        key="prompt-cache-stale",
        account_id=accounts[0].id,
        kind=StickySessionKind.PROMPT_CACHE,
        updated_at_offset_seconds=600,
    )
    await _insert_sticky_session(
        key="codex-session-old",
        account_id=accounts[1].id,
        kind=StickySessionKind.CODEX_SESSION,
        updated_at_offset_seconds=600,
    )

    response = await async_client.post("/api/sticky-sessions/purge", json={"staleOnly": False})
    assert response.status_code == 422

    response = await async_client.get("/api/sticky-sessions")
    assert response.status_code == 200
    payload = response.json()
    assert payload["stalePromptCacheCount"] == 1
    assert {entry["key"] for entry in payload["entries"]} == {"prompt-cache-stale", "codex-session-old"}


@pytest.mark.asyncio
async def test_sticky_sessions_api_counts_hidden_stale_rows_and_deletes_by_kind(async_client):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)

    for index in range(101):
        await _insert_sticky_session(
            key=f"fresh-session-{index:03d}",
            account_id=accounts[index % len(accounts)].id,
            kind=StickySessionKind.STICKY_THREAD,
            updated_at_offset_seconds=index + 1,
        )

    await _insert_sticky_session(
        key="shared-key",
        account_id=accounts[0].id,
        kind=StickySessionKind.PROMPT_CACHE,
        updated_at_offset_seconds=600,
    )
    await _insert_sticky_session(
        key="shared-key",
        account_id=accounts[1].id,
        kind=StickySessionKind.CODEX_SESSION,
        updated_at_offset_seconds=5,
    )

    response = await async_client.get("/api/sticky-sessions", params={"limit": "10", "offset": "0"})
    assert response.status_code == 200
    payload = response.json()

    assert payload["stalePromptCacheCount"] == 1
    assert payload["total"] == 103
    assert payload["hasMore"] is True
    assert len(payload["entries"]) == 10
    assert not any(entry["key"] == "shared-key" and entry["kind"] == "prompt_cache" for entry in payload["entries"])
    assert any(entry["key"] == "shared-key" and entry["kind"] == "codex_session" for entry in payload["entries"])

    response = await async_client.get(
        "/api/sticky-sessions", params={"staleOnly": "true", "limit": "10", "offset": "0"}
    )
    assert response.status_code == 200
    stale_payload = response.json()
    assert stale_payload["stalePromptCacheCount"] == 1
    assert stale_payload["total"] == 1
    assert stale_payload["hasMore"] is False
    assert [(entry["key"], entry["kind"]) for entry in stale_payload["entries"]] == [("shared-key", "prompt_cache")]

    response = await async_client.delete("/api/sticky-sessions/prompt_cache/shared-key")
    assert response.status_code == 200

    response = await async_client.get("/api/sticky-sessions")
    assert response.status_code == 200
    after_delete = response.json()
    assert after_delete["stalePromptCacheCount"] == 0
    assert after_delete["total"] == 102
    assert any(entry["key"] == "shared-key" and entry["kind"] == "codex_session" for entry in after_delete["entries"])


@pytest.mark.asyncio
async def test_sticky_sessions_api_applies_offset_before_returning_page(async_client):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)

    for index in range(15):
        await _insert_sticky_session(
            key=f"page-session-{index:02d}",
            account_id=accounts[index % len(accounts)].id,
            kind=StickySessionKind.STICKY_THREAD,
            updated_at_offset_seconds=index + 1,
        )

    response = await async_client.get("/api/sticky-sessions", params={"limit": "10", "offset": "10"})
    assert response.status_code == 200
    payload = response.json()

    assert payload["total"] == 15
    assert payload["hasMore"] is False
    assert len(payload["entries"]) == 5


@pytest.mark.asyncio
async def test_sticky_sessions_api_deletes_slash_containing_keys(async_client):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)
    sticky_key = "folder/session"

    await _insert_sticky_session(
        key=sticky_key,
        account_id=accounts[0].id,
        kind=StickySessionKind.PROMPT_CACHE,
        updated_at_offset_seconds=10,
    )

    response = await async_client.get("/api/sticky-sessions")
    assert response.status_code == 200
    assert any(entry["key"] == sticky_key for entry in response.json()["entries"])

    response = await async_client.delete(f"/api/sticky-sessions/prompt_cache/{quote(sticky_key, safe='')}")
    assert response.status_code == 200

    response = await async_client.get("/api/sticky-sessions")
    assert response.status_code == 200
    assert all(entry["key"] != sticky_key for entry in response.json()["entries"])


@pytest.mark.asyncio
async def test_sticky_sessions_cleanup_scheduler_removes_only_stale_prompt_cache(db_setup):
    accounts = await _create_accounts()
    await _set_affinity_ttl(60)
    await _insert_sticky_session(
        key="cleanup-stale",
        account_id=accounts[0].id,
        kind=StickySessionKind.PROMPT_CACHE,
        updated_at_offset_seconds=600,
    )
    await _insert_sticky_session(
        key="cleanup-durable",
        account_id=accounts[1].id,
        kind=StickySessionKind.STICKY_THREAD,
        updated_at_offset_seconds=600,
    )

    scheduler = StickySessionCleanupScheduler(interval_seconds=300, enabled=True)
    await scheduler._cleanup_once()

    async with SessionLocal() as session:
        remaining = {
            row[0] for row in (await session.execute(text("SELECT key FROM sticky_sessions ORDER BY key"))).fetchall()
        }

    assert remaining == {"cleanup-durable"}
