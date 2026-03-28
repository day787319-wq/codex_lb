## ADDED Requirements
### Requirement: Dashboard can create sticky-session mappings manually
The system SHALL provide a dashboard API that lets an operator create or replace a sticky-session mapping by `key`, `kind`, and `account_id`.

#### Scenario: Create a manual sticky-session mapping

- **WHEN** the dashboard submits a non-empty `key`, a valid sticky-session `kind`, and an existing `account_id`
- **THEN** the system upserts the `(key, kind)` mapping to the selected account
- **AND** the response includes the saved mapping metadata

#### Scenario: Reject manual mapping for an unknown account

- **WHEN** the dashboard submits a sticky-session create request with an `account_id` that does not exist
- **THEN** the system rejects the request with a not-found dashboard error
