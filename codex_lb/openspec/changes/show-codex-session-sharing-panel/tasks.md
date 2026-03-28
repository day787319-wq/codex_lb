## 1. Backend

- [x] 1.1 Add a sticky-session usage endpoint for the current `codex_session`
- [x] 1.2 Expose live bridge turn-state metadata for the current session when available
- [x] 1.3 Return other `codex_session` mappings that use the same account
- [x] 1.4 Add backend regression coverage for the new usage endpoint

## 2. Frontend

- [x] 2.1 Add sticky-session usage schemas and API client support
- [x] 2.2 Show a dashboard panel with the current session key and copyable turn-state
- [x] 2.3 Show whether other session keys are using the same account
- [x] 2.4 Invalidate the new sticky-session usage query after account and sticky-session mutations
- [x] 2.5 Add frontend regression coverage for the usage panel

## 3. Verification

- [x] 3.1 Run focused backend and frontend tests for sticky-session usage details and dashboard rendering
