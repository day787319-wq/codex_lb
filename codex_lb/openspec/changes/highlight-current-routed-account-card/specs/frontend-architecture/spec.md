## ADDED Requirements
### Requirement: Dashboard highlights the current routed account card
The Dashboard page SHALL visually distinguish the account card that matches the current routed `codex_session`.

#### Scenario: Current routed account card is highlighted

- **WHEN** the dashboard knows which `account_id` the current `codex_session` is pinned to
- **THEN** the matching account card is rendered with a distinct highlight so operators can identify the active routed account at a glance
