## ADDED Requirements
### Requirement: Sticky-session dashboard responses identify the mapped account
The sticky-session dashboard API SHALL include the mapped `account_id` for each returned entry so operators and frontend views can match a mapping to an account deterministically.

#### Scenario: List sticky sessions returns account identifier

- **WHEN** the dashboard requests sticky-session entries
- **THEN** each returned entry includes the mapped `account_id` alongside the display metadata
