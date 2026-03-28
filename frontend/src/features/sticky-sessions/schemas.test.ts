import { describe, expect, it } from "vitest";

import {
  CurrentCodexSessionUsageResponseSchema,
  StickySessionCreateRequestSchema,
  StickySessionCreateResponseSchema,
  StickySessionEntrySchema,
  StickySessionIdentifierSchema,
  StickySessionsListParamsSchema,
  StickySessionsListResponseSchema,
  StickySessionsPurgeRequestSchema,
} from "@/features/sticky-sessions/schemas";

describe("StickySessionEntrySchema", () => {
  it("parses sticky session metadata", () => {
    const parsed = StickySessionEntrySchema.parse({
      key: "thread_123",
      accountId: "acc_primary",
      displayName: "sticky-a@example.com",
      kind: "prompt_cache",
      createdAt: "2026-03-10T12:00:00Z",
      updatedAt: "2026-03-10T12:05:00Z",
      expiresAt: "2026-03-10T12:10:00Z",
      isStale: false,
    });

    expect(parsed.kind).toBe("prompt_cache");
    expect(parsed.accountId).toBe("acc_primary");
    expect(parsed.displayName).toBe("sticky-a@example.com");
    expect(parsed.expiresAt).toBe("2026-03-10T12:10:00Z");
  });
});

describe("CurrentCodexSessionUsageResponseSchema", () => {
  it("parses the current codex-session usage payload", () => {
    const parsed = CurrentCodexSessionUsageResponseSchema.parse({
      current: {
        key: "session_123",
        accountId: "acc_primary",
        displayName: "sticky-a@example.com",
        kind: "codex_session",
        createdAt: "2026-03-10T12:00:00Z",
        updatedAt: "2026-03-10T12:05:00Z",
        expiresAt: null,
        isStale: false,
        turnState: "http_turn_123",
        liveBridgeConnected: true,
      },
      otherSessionsUsingAccount: [
        {
          key: "session_456",
          accountId: "acc_primary",
          displayName: "sticky-a@example.com",
          kind: "codex_session",
          createdAt: "2026-03-10T12:00:00Z",
          updatedAt: "2026-03-10T12:01:00Z",
          expiresAt: null,
          isStale: false,
        },
      ],
    });

    expect(parsed.current?.turnState).toBe("http_turn_123");
    expect(parsed.otherSessionsUsingAccount).toHaveLength(1);
  });
});

describe("StickySessionsListResponseSchema", () => {
  it("defaults entries and stalePromptCacheCount", () => {
    const parsed = StickySessionsListResponseSchema.parse({});
    expect(parsed.entries).toEqual([]);
    expect(parsed.stalePromptCacheCount).toBe(0);
    expect(parsed.total).toBe(0);
    expect(parsed.hasMore).toBe(false);
  });
});

describe("StickySessionsListParamsSchema", () => {
  it("defaults pagination parameters", () => {
    const parsed = StickySessionsListParamsSchema.parse({});
    expect(parsed).toEqual({ staleOnly: false, offset: 0, limit: 10 });
  });

  it("accepts optional kind filters", () => {
    const parsed = StickySessionsListParamsSchema.parse({
      kind: "codex_session",
      limit: 1,
    });
    expect(parsed).toEqual({ kind: "codex_session", staleOnly: false, offset: 0, limit: 1 });
  });
});

describe("StickySessionIdentifierSchema", () => {
  it("parses composite sticky-session identities", () => {
    const parsed = StickySessionIdentifierSchema.parse({
      key: "thread_123",
      kind: "prompt_cache",
    });

    expect(parsed).toEqual({
      key: "thread_123",
      kind: "prompt_cache",
    });
  });
});

describe("StickySessionCreateRequestSchema", () => {
  it("trims key and account identifiers", () => {
    const parsed = StickySessionCreateRequestSchema.parse({
      key: " session_123 ",
      kind: "codex_session",
      accountId: " acc_primary ",
    });

    expect(parsed).toEqual({
      key: "session_123",
      kind: "codex_session",
      accountId: "acc_primary",
    });
  });
});

describe("StickySessionCreateResponseSchema", () => {
  it("parses a saved sticky-session response", () => {
    const parsed = StickySessionCreateResponseSchema.parse({
      status: "saved",
      entry: {
        key: "session_123",
        accountId: "acc_primary",
        displayName: "sticky-a@example.com",
        kind: "codex_session",
        createdAt: "2026-03-10T12:00:00Z",
        updatedAt: "2026-03-10T12:05:00Z",
        expiresAt: null,
        isStale: false,
      },
    });

    expect(parsed.status).toBe("saved");
    expect(parsed.entry.accountId).toBe("acc_primary");
    expect(parsed.entry.displayName).toBe("sticky-a@example.com");
  });
});

describe("StickySessionsPurgeRequestSchema", () => {
  it("defaults staleOnly to true", () => {
    const parsed = StickySessionsPurgeRequestSchema.parse({});
    expect(parsed.staleOnly).toBe(true);
  });
});
