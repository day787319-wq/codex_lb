import { del, get, post } from "@/lib/api-client";

import {
  CurrentCodexSessionUsageResponseSchema,
  StickySessionCreateRequestSchema,
  StickySessionCreateResponseSchema,
  StickySessionDeleteResponseSchema,
  StickySessionIdentifierSchema,
  StickySessionsListParamsSchema,
  StickySessionsListResponseSchema,
  StickySessionsPurgeRequestSchema,
  StickySessionsPurgeResponseSchema,
} from "@/features/sticky-sessions/schemas";

const STICKY_SESSIONS_PATH = "/api/sticky-sessions";

export function getCurrentCodexSessionUsage() {
  return get(`${STICKY_SESSIONS_PATH}/current-codex-session`, CurrentCodexSessionUsageResponseSchema);
}

export function listStickySessions(params: unknown) {
  const validated = StickySessionsListParamsSchema.parse(params);
  const searchParams = new URLSearchParams();
  if (validated.kind) {
    searchParams.set("kind", validated.kind);
  }
  searchParams.set("staleOnly", String(validated.staleOnly));
  searchParams.set("offset", String(validated.offset));
  searchParams.set("limit", String(validated.limit));
  return get(`${STICKY_SESSIONS_PATH}?${searchParams.toString()}`, StickySessionsListResponseSchema);
}

export function deleteStickySession(payload: unknown) {
  const validated = StickySessionIdentifierSchema.parse(payload);
  return del(
    `${STICKY_SESSIONS_PATH}/${validated.kind}/${encodeURIComponent(validated.key)}`,
    StickySessionDeleteResponseSchema,
  );
}

export function createStickySession(payload: unknown) {
  const validated = StickySessionCreateRequestSchema.parse(payload);
  return post(STICKY_SESSIONS_PATH, StickySessionCreateResponseSchema, {
    body: validated,
  });
}

export function purgeStickySessions(payload: unknown) {
  const validated = StickySessionsPurgeRequestSchema.parse(payload);
  return post(`${STICKY_SESSIONS_PATH}/purge`, StickySessionsPurgeResponseSchema, {
    body: validated,
  });
}
