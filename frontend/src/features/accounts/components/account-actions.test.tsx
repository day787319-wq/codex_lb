import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AccountActions } from "@/features/accounts/components/account-actions";
import { createAccountSummary } from "@/test/mocks/factories";

describe("AccountActions", () => {
  it("invokes the exclusive-use action for non-deactivated accounts", async () => {
    const user = userEvent.setup();
    const account = createAccountSummary();
    const onUseOnly = vi.fn();

    render(
      <AccountActions
        account={account}
        busy={false}
        onUseOnly={onUseOnly}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onDelete={vi.fn()}
        onReauth={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Use This Account Only" }));

    expect(onUseOnly).toHaveBeenCalledWith(account.accountId);
  });

  it("hides the exclusive-use action for deactivated accounts", () => {
    render(
      <AccountActions
        account={createAccountSummary({ status: "deactivated" })}
        busy={false}
        onUseOnly={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onDelete={vi.fn()}
        onReauth={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Use This Account Only" })).not.toBeInTheDocument();
  });
});
