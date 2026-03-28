## ADDED Requirements
### Requirement: Dashboard shows codex-session sharing details
The Dashboard page SHALL show a panel that helps the operator inspect and share the current personal Codex session across devices.

#### Scenario: Dashboard panel shows the current session key and turn-state

- **WHEN** the dashboard has current `codex_session` usage details
- **THEN** it shows the current durable `codex_session` key
- **AND** it shows the current live `x-codex-turn-state` when available
- **AND** it offers copy actions for the displayed values

#### Scenario: Dashboard panel shows other session keys using the same account

- **WHEN** other durable `codex_session` keys are pinned to the same account as the current session
- **THEN** the dashboard panel lists those other session keys so the operator can see shared account usage
