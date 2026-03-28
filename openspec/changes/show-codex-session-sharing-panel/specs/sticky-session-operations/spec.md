## ADDED Requirements
### Requirement: Dashboard sticky-session usage endpoint exposes current codex-session details
The dashboard SHALL expose the current durable `codex_session` mapping together with live bridge turn-state metadata when that live bridge is available.

#### Scenario: Current codex-session usage includes live turn-state

- **WHEN** a `codex_session` mapping exists and the matching HTTP bridge session is currently live
- **THEN** the dashboard usage response includes the durable `codex_session` key
- **AND** the response includes the current live `x-codex-turn-state`

#### Scenario: Current codex-session usage omits turn-state when no live bridge exists

- **WHEN** a `codex_session` mapping exists but no matching live HTTP bridge session is active
- **THEN** the dashboard usage response still includes the durable `codex_session` key
- **AND** the live `x-codex-turn-state` field is `null`

### Requirement: Dashboard sticky-session usage endpoint reports other session keys on the same account
The dashboard SHALL report other durable `codex_session` mappings that are pinned to the same account as the current mapping.

#### Scenario: Other codex-session mappings share the current account

- **WHEN** multiple durable `codex_session` rows point to the same account
- **THEN** the dashboard usage response lists the other `codex_session` keys that use that account
