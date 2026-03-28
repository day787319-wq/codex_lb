## ADDED Requirements
### Requirement: Account management surfaces can force one active account
The Accounts page and dashboard account cards SHALL provide a one-click action that makes one selected account the only active account in the pool by reactivating that account and pausing the other non-deactivated accounts through the accounts API.

#### Scenario: Use one account only from account detail

- **WHEN** a user clicks `Use This Account Only` for an account on the Accounts page
- **THEN** the app calls the account action API for that account
- **AND** the selected account becomes active
- **AND** every other non-deactivated account becomes paused
- **AND** the accounts list and dashboard overview refresh

#### Scenario: Use one account only from dashboard card

- **WHEN** a user clicks `Use Only` for an account card on the Dashboard page
- **THEN** the app calls the account action API for that account
- **AND** the selected account becomes active
- **AND** every other non-deactivated account becomes paused
- **AND** the dashboard overview refreshes
