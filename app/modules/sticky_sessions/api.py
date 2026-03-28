from __future__ import annotations

from fastapi import APIRouter, Body, Depends, Query

from app.core.auth.dependencies import set_dashboard_error_format, validate_dashboard_session
from app.core.exceptions import DashboardNotFoundError
from app.db.models import StickySessionKind
from app.dependencies import ProxyContext, StickySessionsContext, get_proxy_context, get_sticky_sessions_context
from app.modules.sticky_sessions.schemas import (
    CurrentCodexSessionEntryResponse,
    CurrentCodexSessionUsageResponse,
    StickySessionCreateRequest,
    StickySessionCreateResponse,
    StickySessionDeleteResponse,
    StickySessionEntryResponse,
    StickySessionsListResponse,
    StickySessionsPurgeRequest,
    StickySessionsPurgeResponse,
)

router = APIRouter(
    prefix="/api/sticky-sessions",
    tags=["dashboard"],
    dependencies=[Depends(validate_dashboard_session), Depends(set_dashboard_error_format)],
)


def _entry_response(entry) -> StickySessionEntryResponse:
    return StickySessionEntryResponse(
        key=entry.key,
        account_id=entry.account_id,
        display_name=entry.display_name,
        kind=entry.kind,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        expires_at=entry.expires_at,
        is_stale=entry.is_stale,
    )


@router.get("", response_model=StickySessionsListResponse)
async def list_sticky_sessions(
    kind: StickySessionKind | None = Query(default=None),
    stale_only: bool = Query(default=False, alias="staleOnly"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    context: StickySessionsContext = Depends(get_sticky_sessions_context),
) -> StickySessionsListResponse:
    result = await context.service.list_entries(kind=kind, stale_only=stale_only, offset=offset, limit=limit)
    return StickySessionsListResponse(
        entries=[_entry_response(entry) for entry in result.entries],
        stale_prompt_cache_count=result.stale_prompt_cache_count,
        total=result.total,
        has_more=result.has_more,
    )


@router.get("/current-codex-session", response_model=CurrentCodexSessionUsageResponse)
async def get_current_codex_session_usage(
    context: StickySessionsContext = Depends(get_sticky_sessions_context),
    proxy_context: ProxyContext = Depends(get_proxy_context),
) -> CurrentCodexSessionUsageResponse:
    result = await context.service.get_current_codex_session_usage(
        live_codex_sessions=await proxy_context.service.list_live_codex_bridge_sessions(),
    )
    current = result.current
    return CurrentCodexSessionUsageResponse(
        current=(
            CurrentCodexSessionEntryResponse(
                key=current.key,
                account_id=current.account_id,
                display_name=current.display_name,
                kind=current.kind,
                created_at=current.created_at,
                updated_at=current.updated_at,
                expires_at=current.expires_at,
                is_stale=current.is_stale,
                turn_state=current.turn_state,
                live_bridge_connected=current.live_bridge_connected,
            )
            if current is not None
            else None
        ),
        other_sessions_using_account=[_entry_response(entry) for entry in result.other_sessions_using_account],
    )


@router.post("", response_model=StickySessionCreateResponse)
async def create_sticky_session(
    payload: StickySessionCreateRequest,
    context: StickySessionsContext = Depends(get_sticky_sessions_context),
) -> StickySessionCreateResponse:
    entry = await context.service.create_entry(
        payload.key,
        kind=payload.kind,
        account_id=payload.account_id,
    )
    return StickySessionCreateResponse(
        status="saved",
        entry=_entry_response(entry),
    )


@router.post("/purge", response_model=StickySessionsPurgeResponse)
async def purge_sticky_sessions(
    payload: StickySessionsPurgeRequest = Body(default=StickySessionsPurgeRequest()),
    context: StickySessionsContext = Depends(get_sticky_sessions_context),
) -> StickySessionsPurgeResponse:
    deleted_count = await context.service.purge_entries()
    return StickySessionsPurgeResponse(deleted_count=deleted_count)


@router.delete("/{kind}/{key:path}", response_model=StickySessionDeleteResponse)
async def delete_sticky_session(
    kind: StickySessionKind,
    key: str,
    context: StickySessionsContext = Depends(get_sticky_sessions_context),
) -> StickySessionDeleteResponse:
    deleted = await context.service.delete_entry(key, kind=kind)
    if not deleted:
        raise DashboardNotFoundError("Sticky session not found", code="sticky_session_not_found")
    return StickySessionDeleteResponse(status="deleted")
