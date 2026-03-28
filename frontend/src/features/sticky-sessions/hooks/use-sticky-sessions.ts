import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { listAccounts } from "@/features/accounts/api";
import {
  createStickySession,
  deleteStickySession,
  listStickySessions,
  purgeStickySessions,
} from "@/features/sticky-sessions/api";
import type {
  StickySessionCreateRequest,
  StickySessionIdentifier,
  StickySessionsListParams,
} from "@/features/sticky-sessions/schemas";

const DEFAULT_STICKY_SESSIONS_LIMIT = 10;

export function useStickySessions() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<StickySessionsListParams>({
    staleOnly: false,
    offset: 0,
    limit: DEFAULT_STICKY_SESSIONS_LIMIT,
  });

  const stickySessionsQuery = useQuery({
    queryKey: ["sticky-sessions", "list", params],
    queryFn: () => listStickySessions(params),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts", "list"],
    queryFn: listAccounts,
    select: (data) => data.accounts,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["sticky-sessions"] });
  };

  const setOffset = (offset: number) => {
    setParams((current) => ({ ...current, offset }));
  };

  const setLimit = (limit: number) => {
    setParams((current) => ({ ...current, limit, offset: 0 }));
  };

  const deleteMutation = useMutation({
    mutationFn: (target: StickySessionIdentifier) => deleteStickySession(target),
    onSuccess: () => {
      toast.success("Sticky session removed");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove sticky session");
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: StickySessionCreateRequest) => createStickySession(payload),
    onSuccess: () => {
      toast.success("Sticky session saved");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save sticky session");
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (staleOnly: boolean) => purgeStickySessions({ staleOnly }),
    onSuccess: (response) => {
      toast.success(`Purged ${response.deletedCount} sticky sessions`);
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to purge sticky sessions");
    },
  });

  return {
    params,
    setOffset,
    setLimit,
    accountsQuery,
    stickySessionsQuery,
    createMutation,
    deleteMutation,
    purgeMutation,
  };
}
