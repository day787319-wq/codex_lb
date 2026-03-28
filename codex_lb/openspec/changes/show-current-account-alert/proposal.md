## Why

Operators can switch accounts or rely on routing policies, but the dashboard does not tell them which account the current Codex session is actually pinned to. This makes it hard to confirm whether `Use Only` or sticky-session routing has taken effect.

## What Changes

- Show a dashboard alert that tells the operator which account the current `codex_session` is using.
- Show a fallback message when no Codex session has been pinned yet so the operator knows the next routed request will choose an account.
- Refresh the alert when account actions invalidate dashboard routing state.

## Impact

- Code: `frontend/src/features/dashboard/*`, `frontend/src/features/sticky-sessions/*`, `frontend/src/features/accounts/hooks/*`, `frontend/src/test/mocks/*`
- Tests: dashboard component tests, sticky-session schema/api tests, account hook invalidation tests
- Specs: `openspec/specs/frontend-architecture/spec.md`
