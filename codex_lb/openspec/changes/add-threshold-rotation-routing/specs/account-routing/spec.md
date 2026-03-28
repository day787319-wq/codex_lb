## ADDED Requirements
### Requirement: Threshold rotation selects accounts by ordered quota bands
The proxy SHALL support a `threshold_rotation` routing mode that uses an operator-defined ordered account list and selects the first eligible account whose primary-window remaining percent is above the highest currently available threshold band.

#### Scenario: Rotation starts in the highest band

- **WHEN** the ordered accounts have primary remaining percentages of `100`, `100`, and `98`
- **THEN** the selector uses the first ordered account in the `>90` band

#### Scenario: Rotation advances to the next ordered account within a band

- **WHEN** the first ordered account reaches `90` primary remaining percent
- **AND** a later ordered account is still above `90`
- **THEN** the selector skips the first account and uses the next ordered account above `90`

#### Scenario: Rotation drops to the next threshold band after exhausting a band

- **WHEN** no ordered account remains above `90`
- **AND** at least one ordered account remains above `80`
- **THEN** the selector restarts from the beginning of the configured order and uses the first account above `80`

#### Scenario: Rotation waits for reset after the minimum band is exhausted

- **WHEN** no eligible ordered account remains above the configured minimum threshold band
- **THEN** the selector does not choose a threshold-rotation account until a reset makes an ordered account eligible again

#### Scenario: Rotation skips unavailable accounts

- **WHEN** an ordered account is paused, deactivated, rate limited, quota exceeded, or otherwise ineligible
- **THEN** the selector skips that account and continues evaluating the remaining ordered accounts

#### Scenario: Codex session affinity rebinds when a pinned account drops bands

- **WHEN** a `codex_session` sticky mapping is pinned to an ordered account
- **AND** that account falls out of the highest currently available threshold band
- **AND** another ordered account remains eligible in a higher threshold band
- **THEN** the next threshold-rotation selection rebinds the `codex_session` to the higher-band account

#### Scenario: Idle HTTP bridge codex session reconnects after a threshold step drop

- **WHEN** an idle HTTP bridge session is bound to a `codex_session` sticky mapping
- **AND** that account falls out of the highest currently available threshold band
- **AND** another ordered account remains eligible in a higher threshold band
- **THEN** the next HTTP bridge request closes the stale bridge session and reconnects on the higher-band account
