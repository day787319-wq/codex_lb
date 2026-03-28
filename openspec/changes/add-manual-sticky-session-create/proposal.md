## Why

Operators can inspect and delete sticky-session mappings from the Settings page, but they still have to touch the database when they want to pin a specific `codex_session`, `sticky_thread`, or `prompt_cache` key to an account manually. That is operationally awkward and easy to get wrong.

## What Changes

- Add a dashboard sticky-session API that creates or replaces a mapping for a chosen `(key, kind, account_id)`.
- Validate that the selected account exists before saving the mapping.
- Add a manual create form to the Settings page sticky-session section so operators can add mappings without editing SQLite directly.
- Refresh the sticky-session table after create, delete, and purge actions.

## Impact

- Code: `app/modules/sticky_sessions/*`, `app/modules/proxy/sticky_repository.py`, `frontend/src/features/sticky-sessions/*`, `frontend/src/test/mocks/*`
- Tests: sticky-session API integration tests, sticky-session hook/component tests, schema/api tests
- Specs: `openspec/specs/sticky-session-operations/spec.md`, `openspec/specs/frontend-architecture/spec.md`
