## ADDED Requirements
### Requirement: Dashboard shows the current routed account
The Dashboard page SHALL show an account-routing alert that tells the operator which account the current `codex_session` sticky mapping is using so account switches can be verified without opening the sticky-session table.

#### Scenario: Dashboard shows the pinned Codex session account

- **WHEN** the sticky-session API returns a `codex_session` entry for the current dashboard view
- **THEN** the dashboard shows an alert identifying the pinned account
- **AND** the alert indicates that routed follow-up requests for that Codex session will keep using that account

#### Scenario: Dashboard explains when no Codex session is pinned

- **WHEN** the sticky-session API returns no `codex_session` entry
- **THEN** the dashboard shows an alert explaining that no Codex session is pinned yet
- **AND** the alert explains that the next routed request will choose an eligible account
