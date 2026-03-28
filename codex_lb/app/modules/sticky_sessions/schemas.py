from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator

from app.db.models import StickySessionKind
from app.modules.shared.schemas import DashboardModel


class StickySessionEntryResponse(DashboardModel):
    key: str
    account_id: str
    display_name: str
    kind: StickySessionKind
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None = None
    is_stale: bool


class StickySessionsListResponse(DashboardModel):
    entries: list[StickySessionEntryResponse] = Field(default_factory=list)
    stale_prompt_cache_count: int = 0
    total: int = 0
    has_more: bool = False


class CurrentCodexSessionEntryResponse(StickySessionEntryResponse):
    turn_state: str | None = None
    live_bridge_connected: bool = False


class CurrentCodexSessionUsageResponse(DashboardModel):
    current: CurrentCodexSessionEntryResponse | None = None
    other_sessions_using_account: list[StickySessionEntryResponse] = Field(default_factory=list)


class StickySessionDeleteResponse(DashboardModel):
    status: str


class StickySessionCreateRequest(DashboardModel):
    key: str = Field(min_length=1)
    kind: StickySessionKind
    account_id: str = Field(min_length=1)

    @field_validator("key", "account_id")
    @classmethod
    def _strip_required(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be blank")
        return stripped


class StickySessionCreateResponse(DashboardModel):
    status: Literal["saved"]
    entry: StickySessionEntryResponse


class StickySessionsPurgeRequest(DashboardModel):
    stale_only: Literal[True] = True


class StickySessionsPurgeResponse(DashboardModel):
    deleted_count: int
