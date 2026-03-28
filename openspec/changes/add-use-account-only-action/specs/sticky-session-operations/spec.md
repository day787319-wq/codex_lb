## ADDED Requirements
### Requirement: Exclusive account activation clears stale affinity
When an operator activates one account exclusively from the dashboard, the system SHALL invalidate sticky-session and HTTP responses bridge affinity that still targets other accounts so subsequent routed requests do not continue on now-paused accounts.

#### Scenario: Exclusive activation removes stale routing continuity

- **WHEN** the dashboard activates one account exclusively
- **AND** persisted sticky-session mappings or live HTTP bridge sessions still point at other accounts
- **THEN** the system clears those persisted mappings and closes those live bridge sessions
- **AND** subsequent routed requests select only from the updated active-account pool
