import { useMemo, useState } from "react";
import { Pin } from "lucide-react";

import { AlertMessage } from "@/components/alert-message";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/features/dashboard/components/filters/pagination-controls";
import { useStickySessions } from "@/features/sticky-sessions/hooks/use-sticky-sessions";
import type { StickySessionIdentifier, StickySessionKind } from "@/features/sticky-sessions/schemas";
import { useDialogState } from "@/hooks/use-dialog-state";
import { getErrorMessageOrNull } from "@/utils/errors";
import { formatTimeLong } from "@/utils/formatters";

function kindLabel(kind: StickySessionKind): string {
  switch (kind) {
    case "codex_session":
      return "Codex session";
    case "sticky_thread":
      return "Sticky thread";
    case "prompt_cache":
      return "Prompt cache";
  }
}

export function StickySessionsSection() {
  const {
    params,
    setLimit,
    setOffset,
    accountsQuery,
    stickySessionsQuery,
    createMutation,
    deleteMutation,
    purgeMutation,
  } = useStickySessions();
  const deleteDialog = useDialogState<StickySessionIdentifier>();
  const purgeDialog = useDialogState();
  const [draftKey, setDraftKey] = useState("");
  const [draftKind, setDraftKind] = useState<StickySessionKind>("codex_session");
  const [draftAccountId, setDraftAccountId] = useState("");

  const mutationError = useMemo(
    () =>
      getErrorMessageOrNull(accountsQuery.error) ||
      getErrorMessageOrNull(stickySessionsQuery.error) ||
      getErrorMessageOrNull(createMutation.error) ||
      getErrorMessageOrNull(deleteMutation.error) ||
      getErrorMessageOrNull(purgeMutation.error),
    [accountsQuery.error, stickySessionsQuery.error, createMutation.error, deleteMutation.error, purgeMutation.error],
  );

  const accounts = accountsQuery.data ?? [];
  const entries = stickySessionsQuery.data?.entries ?? [];
  const staleCount = stickySessionsQuery.data?.stalePromptCacheCount ?? 0;
  const total = stickySessionsQuery.data?.total ?? 0;
  const hasMore = stickySessionsQuery.data?.hasMore ?? false;
  const busy = createMutation.isPending || deleteMutation.isPending || purgeMutation.isPending;
  const hasEntries = entries.length > 0;
  const hasAnyRows = total > 0;
  const manualAccountId = accounts.some((account) => account.accountId === draftAccountId)
    ? draftAccountId
    : (accounts[0]?.accountId ?? "");
  const canSaveManual = draftKey.trim().length > 0 && manualAccountId.length > 0 && !busy;

  return (
    <section className="space-y-3 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Pin className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Sticky sessions</h3>
          <p className="text-xs text-muted-foreground">
            Inspect durable mappings and purge stale prompt-cache affinity rows.
          </p>
        </div>
      </div>

      {mutationError ? <AlertMessage variant="error">{mutationError}</AlertMessage> : null}

      <form
        className="space-y-3 rounded-lg border px-3 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSaveManual) {
            return;
          }
          void createMutation
            .mutateAsync({
              key: draftKey,
              kind: draftKind,
              accountId: manualAccountId,
            })
            .then(() => {
              setDraftKey("");
            });
        }}
      >
        <div>
          <h4 className="text-sm font-medium">Add manual mapping</h4>
          <p className="text-xs text-muted-foreground">
            Create or replace a sticky-session row by key, kind, and account.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="sticky-session-key">Key</Label>
            <Input
              id="sticky-session-key"
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              placeholder="session_id or prompt_cache_key"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sticky-session-kind">Kind</Label>
            <Select value={draftKind} onValueChange={(value) => setDraftKind(value as StickySessionKind)}>
              <SelectTrigger id="sticky-session-kind" className="w-full">
                <SelectValue placeholder="Choose kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="codex_session">Codex session</SelectItem>
                <SelectItem value="sticky_thread">Sticky thread</SelectItem>
                <SelectItem value="prompt_cache">Prompt cache</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sticky-session-account">Account</Label>
            <Select
              value={manualAccountId}
              onValueChange={setDraftAccountId}
              disabled={accounts.length === 0}
            >
              <SelectTrigger id="sticky-session-account" className="w-full">
                <SelectValue placeholder={accountsQuery.isLoading ? "Loading accounts..." : "Choose account"} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.accountId} value={account.accountId}>
                    {account.displayName} ({account.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="md:min-w-32" disabled={!canSaveManual}>
            Save mapping
          </Button>
        </div>
        {accounts.length === 0 && !accountsQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Import an account before creating a sticky-session mapping.</p>
        ) : null}
      </form>

      <div className="flex flex-col gap-3 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Visible rows</span>
            <span className="text-sm font-medium tabular-nums">{total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Stale prompt-cache</span>
            <span className="text-sm font-medium tabular-nums">{staleCount}</span>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={busy || staleCount === 0}
          onClick={() => purgeDialog.show()}
        >
          Purge stale
        </Button>
      </div>

      {stickySessionsQuery.isLoading && !stickySessionsQuery.data ? (
        <div className="py-8">
          <SpinnerBlock />
        </div>
      ) : !hasAnyRows ? (
        <EmptyState
          icon={Pin}
          title="No sticky sessions"
          description="Sticky mappings appear here after routed requests create them."
        />
      ) : (
        <>
          {hasEntries ? (
            <div className="overflow-x-auto rounded-xl border">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%] min-w-[14rem] pl-4 text-[11px] uppercase tracking-wider text-muted-foreground/80">
                      Key
                    </TableHead>
                    <TableHead className="w-[14%] min-w-[8rem] text-[11px] uppercase tracking-wider text-muted-foreground/80">
                      Kind
                    </TableHead>
                    <TableHead className="w-[18%] min-w-[9rem] text-[11px] uppercase tracking-wider text-muted-foreground/80">
                      Account
                    </TableHead>
                    <TableHead className="w-[16%] min-w-[9rem] text-[11px] uppercase tracking-wider text-muted-foreground/80">
                      Updated
                    </TableHead>
                    <TableHead className="w-[16%] min-w-[9rem] text-[11px] uppercase tracking-wider text-muted-foreground/80">
                      Expiry
                    </TableHead>
                    <TableHead className="w-[6%] min-w-[4.5rem] pr-4 text-right align-middle text-[11px] uppercase tracking-wider text-muted-foreground/80">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const updated = formatTimeLong(entry.updatedAt);
                    const expires = entry.expiresAt ? formatTimeLong(entry.expiresAt) : null;
                    return (
                      <TableRow key={`${entry.kind}:${entry.key}`}>
                        <TableCell className="max-w-[18rem] truncate pl-4 font-mono text-xs" title={entry.key}>
                          {entry.key}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{kindLabel(entry.kind)}</Badge>
                        </TableCell>
                        <TableCell className="truncate text-xs">{entry.displayName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {updated.date} {updated.time}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.isStale ? (
                            <Badge variant="secondary">Stale</Badge>
                          ) : expires ? (
                            `${expires.date} ${expires.time}`
                          ) : (
                            "Durable"
                          )}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={busy}
                            onClick={() => deleteDialog.show({ key: entry.key, kind: entry.kind })}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={Pin}
              title="No sticky sessions on this page"
              description="The current page is empty. Use pagination to navigate to another page."
            />
          )}
          <div className="flex justify-end pt-3">
            <PaginationControls
              total={total}
              limit={params.limit}
              offset={params.offset}
              hasMore={hasMore}
              onLimitChange={setLimit}
              onOffsetChange={setOffset}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Remove sticky session"
        description={
          deleteDialog.data
            ? `${kindLabel(deleteDialog.data.kind)} mapping ${deleteDialog.data.key} will stop pinning future requests.`
            : ""
        }
        confirmLabel="Remove"
        onOpenChange={deleteDialog.onOpenChange}
        onConfirm={() => {
          if (!deleteDialog.data) {
            return;
          }
          void deleteMutation.mutateAsync(deleteDialog.data).finally(() => {
            deleteDialog.hide();
          });
        }}
      />

      <ConfirmDialog
        open={purgeDialog.open}
        title="Purge stale prompt-cache mappings"
        description="Only expired prompt-cache entries will be deleted. Durable session and sticky-thread mappings stay intact."
        confirmLabel="Purge"
        onOpenChange={purgeDialog.onOpenChange}
        onConfirm={() => {
          void purgeMutation.mutateAsync(true).finally(() => {
            purgeDialog.hide();
          });
        }}
      />
    </section>
  );
}
