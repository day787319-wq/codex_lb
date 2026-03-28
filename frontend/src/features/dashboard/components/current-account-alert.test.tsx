import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentAccountAlert } from "@/features/dashboard/components/current-account-alert";
import { useCurrentCodexSessionUsage } from "@/features/dashboard/hooks/use-current-codex-session";

vi.mock("@/features/dashboard/hooks/use-current-codex-session", () => ({
  useCurrentCodexSessionUsage: vi.fn(),
}));

const useCurrentCodexSessionUsageMock = vi.mocked(useCurrentCodexSessionUsage);

describe("CurrentAccountAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the pinned account when a codex session is active", () => {
    useCurrentCodexSessionUsageMock.mockReturnValue({
      data: {
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
      },
      isLoading: false,
      isError: false,
    } as never);

    render(<CurrentAccountAlert />);

    expect(screen.getByText("Current routed account")).toBeInTheDocument();
    expect(screen.getByText("day787319@gmail.com")).toBeInTheDocument();
    expect(screen.getByText(/This Codex session is currently pinned to/i)).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    expect(screen.getByText("Current codex_session key")).toBeInTheDocument();
    expect(screen.getByText("codex-session-1")).toBeInTheDocument();
    expect(screen.getByText("http_turn_day")).toBeInTheDocument();
    expect(screen.getByText("codex-session-2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy session key" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy turn-state" })).toBeInTheDocument();
  });

  it("shows the unpinned fallback when no codex session exists", () => {
    useCurrentCodexSessionUsageMock.mockReturnValue({
      data: {
        current: null,
        otherSessionsUsingAccount: [],
      },
      isLoading: false,
      isError: false,
    } as never);

    render(<CurrentAccountAlert />);

    expect(screen.getByText("Current routed account")).toBeInTheDocument();
    expect(screen.getByText(/No Codex session is pinned yet/i)).toBeInTheDocument();
  });

  it("renders nothing while the session query is still loading", () => {
    useCurrentCodexSessionUsageMock.mockReturnValue({
      data: {
        current: null,
        otherSessionsUsingAccount: [],
      },
      isLoading: true,
      isError: false,
    } as never);

    const { container } = render(<CurrentAccountAlert />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a turn-state fallback when no live bridge is active", () => {
    useCurrentCodexSessionUsageMock.mockReturnValue({
      data: {
        current: {
          key: "codex-session-1",
          accountId: "acc_day",
          displayName: "day787319@gmail.com",
          kind: "codex_session",
          createdAt: "2026-03-27T06:58:00Z",
          updatedAt: "2026-03-27T06:58:16Z",
          expiresAt: null,
          isStale: false,
          turnState: null,
          liveBridgeConnected: false,
        },
        otherSessionsUsingAccount: [],
      },
      isLoading: false,
      isError: false,
    } as never);

    render(<CurrentAccountAlert />);

    expect(screen.getByText(/No live HTTP bridge is active for this session yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy turn-state" })).not.toBeInTheDocument();
  });
});
