import { Pin, Route } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { useCurrentCodexSessionUsage } from "@/features/dashboard/hooks/use-current-codex-session";
import { formatTimeLong } from "@/utils/formatters";

export function CurrentAccountAlert() {
  const currentCodexSessionQuery = useCurrentCodexSessionUsage();
  const entry = currentCodexSessionQuery.data?.current ?? null;
  const otherSessionsUsingAccount = currentCodexSessionQuery.data?.otherSessionsUsingAccount ?? [];

  if ((currentCodexSessionQuery.isLoading && !entry) || (currentCodexSessionQuery.isError && !entry)) {
    return null;
  }

  if (!entry) {
    return (
      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <Route className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Current routed account</h2>
            <p className="text-xs text-muted-foreground">
              No Codex session is pinned yet. The next routed request will choose an eligible account and appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const updated = formatTimeLong(entry.updatedAt);
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Pin className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Current routed account</h2>
          <p className="text-xs text-muted-foreground">
            This Codex session is currently pinned to <span className="font-medium text-foreground">{entry.displayName}</span>. Follow-up routed requests keep using that account until the sticky mapping changes.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Last updated {updated.date} {updated.time}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border bg-background/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Current codex_session key
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{entry.key}</p>
          <div className="mt-2">
            <CopyButton value={entry.key} label="Copy session key" />
          </div>
        </div>
        <div className="rounded-lg border bg-background/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Current x-codex-turn-state
          </p>
          {entry.turnState ? (
            <>
              <p className="mt-1 break-all font-mono text-xs text-foreground">{entry.turnState}</p>
              <div className="mt-2">
                <CopyButton value={entry.turnState} label="Copy turn-state" />
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {entry.liveBridgeConnected
                ? "A live bridge exists, but no turn-state is available yet."
                : "No live HTTP bridge is active for this session yet."}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-lg border bg-background/60 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Other session keys using this account
        </p>
        {otherSessionsUsingAccount.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            No other durable codex_session mappings are currently pinned to this account.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {otherSessionsUsingAccount.map((session) => {
              const otherUpdated = formatTimeLong(session.updatedAt);
              return (
                <div
                  key={`${session.kind}:${session.key}`}
                  className="flex flex-col gap-2 rounded-md border bg-card/60 p-2 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs text-foreground">{session.key}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Updated {otherUpdated.date} {otherUpdated.time}
                    </p>
                  </div>
                  <CopyButton value={session.key} label="Copy key" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
