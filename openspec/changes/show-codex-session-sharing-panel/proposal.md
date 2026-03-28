## Why

Operators can see the currently routed account, but they still cannot answer three practical questions from the dashboard:

- which durable `codex_session` key is currently pinned
- which live `x-codex-turn-state` is active for the shared HTTP bridge
- whether other `codex_session` mappings are using the same account at the same time

That makes it hard to intentionally share one personal session across devices and to understand when multiple session keys are consuming the same account.

## What Changes

- add a dashboard sticky-session usage endpoint for the current `codex_session`
- expose live bridge turn-state metadata for the current session when available
- return other durable `codex_session` keys that are pinned to the same account
- add a dashboard panel with copy buttons for the current session key and turn-state

## Impact

- Code: `app/modules/sticky_sessions/*`, `app/modules/proxy/service.py`, `frontend/src/features/dashboard/*`, `frontend/src/features/sticky-sessions/*`, `frontend/src/test/mocks/*`
- Tests: sticky-session API integration, frontend dashboard hook/component tests, MSW handler coverage
