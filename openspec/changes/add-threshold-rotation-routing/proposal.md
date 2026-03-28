## Why

Some operators want account routing to follow a fixed account order and rotate only after each account has consumed a configured slice of its primary 5-hour quota. The existing `usage_weighted` and `round_robin` strategies cannot enforce a stable operator-defined account order or a quota-band progression such as `>90`, `>80`, down to `>10`.

## What Changes

- Add a `threshold_rotation` routing mode alongside the existing routing strategies.
- Configure the ordered account list and threshold step from environment variables so operators can rotate specific accounts in a fixed order without adding a new database schema.
- Ensure durable `codex_session` affinity re-evaluates the ordered threshold bands so a pinned session can advance automatically when its account drops into a lower band.
- Ensure idle HTTP bridge Codex sessions also re-evaluate the ordered threshold bands so the next request reconnects on the newly selected account instead of reusing the old bridge session.
- Expose the new routing mode in the dashboard settings UI while keeping the order itself operator-managed via environment config.
- Add regression coverage for the selection algorithm, settings API/schema handling, and frontend settings controls.

## Impact

- Code: `app/core/balancer/*`, `app/core/config/settings.py`, `app/modules/proxy/*`, `app/modules/settings/*`, `frontend/src/features/settings/*`, `frontend/src/components/layout/*`
- Tests: `tests/unit/test_load_balancer.py`, `tests/integration/test_settings_api.py`, frontend settings tests, constants tests, mock handlers
- Specs: `openspec/specs/account-routing/spec.md`, `openspec/specs/frontend-architecture/spec.md`
