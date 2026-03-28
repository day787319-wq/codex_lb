import { useQuery } from "@tanstack/react-query";

import { getCurrentCodexSessionUsage } from "@/features/sticky-sessions/api";
import type { CurrentCodexSessionUsageResponse, StickySessionEntry } from "@/features/sticky-sessions/schemas";

const CURRENT_CODEX_SESSION_USAGE_QUERY_KEY = ["sticky-sessions", "current-codex-session-usage"] as const;

export function useCurrentCodexSessionUsage() {
  return useQuery<CurrentCodexSessionUsageResponse>({
    queryKey: CURRENT_CODEX_SESSION_USAGE_QUERY_KEY,
    queryFn: getCurrentCodexSessionUsage,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useCurrentCodexSession() {
  return useQuery<CurrentCodexSessionUsageResponse, Error, StickySessionEntry | null>({
    queryKey: CURRENT_CODEX_SESSION_USAGE_QUERY_KEY,
    queryFn: getCurrentCodexSessionUsage,
    select: (response) => response.current,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
