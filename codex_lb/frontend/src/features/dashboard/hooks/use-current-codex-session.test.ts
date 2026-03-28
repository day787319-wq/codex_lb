import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createElement, type PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import {
  useCurrentCodexSession,
  useCurrentCodexSessionUsage,
} from "@/features/dashboard/hooks/use-current-codex-session";
import { server } from "@/test/mocks/server";

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useCurrentCodexSession", () => {
  it("requests the current codex-session usage and returns the current entry", async () => {
    let seenUrl = "";
    server.use(
      http.get("/api/sticky-sessions/current-codex-session", ({ request }) => {
        seenUrl = request.url;
        return HttpResponse.json({
          current: {
            key: "codex-session-1",
            accountId: "acc_day",
            displayName: "day787319@gmail.com",
            kind: "codex_session",
            createdAt: "2026-03-27T06:58:00Z",
            updatedAt: "2026-03-27T06:58:16Z",
            expiresAt: null,
            isStale: false,
            turnState: "http_turn_day",
            liveBridgeConnected: true,
          },
          otherSessionsUsingAccount: [],
        });
      }),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useCurrentCodexSession(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.accountId).toBe("acc_day");
    expect(result.current.data?.displayName).toBe("day787319@gmail.com");
    expect(seenUrl).toContain("/api/sticky-sessions/current-codex-session");
  });

  it("returns null when no codex-session mapping exists", async () => {
    server.use(
      http.get("/api/sticky-sessions/current-codex-session", () =>
        HttpResponse.json({
          current: null,
          otherSessionsUsingAccount: [],
        }),
      ),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useCurrentCodexSession(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe("useCurrentCodexSessionUsage", () => {
  it("returns the current session usage payload", async () => {
    server.use(
      http.get("/api/sticky-sessions/current-codex-session", () =>
        HttpResponse.json({
          current: {
            key: "codex-session-1",
            accountId: "acc_day",
            displayName: "day787319@gmail.com",
            kind: "codex_session",
            createdAt: "2026-03-27T06:58:00Z",
            updatedAt: "2026-03-27T06:58:16Z",
            expiresAt: null,
            isStale: false,
            turnState: "http_turn_day",
            liveBridgeConnected: true,
          },
          otherSessionsUsingAccount: [
            {
              key: "codex-session-2",
              accountId: "acc_day",
              displayName: "day787319@gmail.com",
              kind: "codex_session",
              createdAt: "2026-03-27T06:50:00Z",
              updatedAt: "2026-03-27T06:55:00Z",
              expiresAt: null,
              isStale: false,
            },
          ],
        }),
      ),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useCurrentCodexSessionUsage(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.current?.turnState).toBe("http_turn_day");
    expect(result.current.data?.otherSessionsUsingAccount).toHaveLength(1);
  });
});
