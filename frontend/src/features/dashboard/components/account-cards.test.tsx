import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountCards } from "@/features/dashboard/components/account-cards";
import { createAccountSummary } from "@/test/mocks/factories";

describe("AccountCards", () => {
  it("highlights the card that matches the current routed account id", () => {
    const currentAccount = createAccountSummary({
      accountId: "acc_current",
      email: "current@example.com",
      displayName: "current@example.com",
    });
    const otherAccount = createAccountSummary({
      accountId: "acc_other",
      email: "other@example.com",
      displayName: "other@example.com",
    });

    render(<AccountCards accounts={[currentAccount, otherAccount]} currentRoutedAccountId="acc_current" />);

    const currentCard = screen.getByText("current@example.com").closest("[data-testid='account-card']");
    const otherCard = screen.getByText("other@example.com").closest("[data-testid='account-card']");

    expect(currentCard).not.toBeNull();
    expect(otherCard).not.toBeNull();
    expect(within(currentCard as HTMLElement).getByText("In use")).toBeInTheDocument();
    expect(within(otherCard as HTMLElement).queryByText("In use")).not.toBeInTheDocument();
  });
});
