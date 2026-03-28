## Why

Operators can pause and resume individual accounts, but there is no fast way to switch the pool to one chosen account from the dashboard. In practice this makes account rotation clumsy because the operator must manually pause multiple accounts to force traffic onto a single account.

## What Changes

- Add a one-click `Use This Account Only` action on account management surfaces so operators can force traffic onto one chosen account quickly.
- Add a backend account-management API that reactivates the chosen account and pauses the other non-deactivated accounts atomically.
- Clear stale sticky-session and HTTP bridge affinity that still points at now-paused accounts so follow-up routed requests honor the exclusive selection immediately.
- Add regression coverage for the backend API, React mutations, and account actions UI.

## Impact

- Code: `app/modules/accounts/*`, `app/modules/proxy/*`, `frontend/src/features/accounts/*`, `frontend/src/test/mocks/*`
- Tests: `tests/integration/test_accounts_api.py`, `tests/integration/test_http_responses_bridge.py`, frontend accounts tests, mock handler coverage
- Specs: `openspec/specs/frontend-architecture/spec.md`, `openspec/specs/sticky-session-operations/spec.md`
