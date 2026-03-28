## Why

The dashboard already shows a banner for the current routed Codex account, but the account cards themselves still look the same. Operators have to visually cross-reference the banner and the cards, which is slow and easy to miss when several accounts are active or paused.

## What Changes

- Expose the sticky-session account identifier in the dashboard sticky-session list response so frontend views can reliably match a sticky mapping to an account card.
- Highlight the dashboard account card that matches the current routed `codex_session`.
- Add frontend regressions for the highlighted card state and sticky-session schema changes.

## Impact

- Code: `app/modules/sticky_sessions/*`, `frontend/src/features/dashboard/*`, `frontend/src/features/sticky-sessions/*`
- Tests: sticky-session API integration tests, dashboard card/component tests, sticky-session schema tests
- Specs: `openspec/specs/sticky-session-operations/spec.md`, `openspec/specs/frontend-architecture/spec.md`
