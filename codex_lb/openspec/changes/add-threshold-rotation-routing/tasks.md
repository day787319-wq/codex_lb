## 1. Routing behavior

- [x] 1.1 Add env-configured threshold rotation ordering and step settings
- [x] 1.2 Implement threshold-band account selection in the load balancer
- [x] 1.3 Re-evaluate `codex_session` affinity against threshold bands so sessions auto-switch at the configured usage step
- [x] 1.4 Re-evaluate idle HTTP bridge `codex_session` reuse against threshold bands before reusing a live upstream session

## 2. Operator controls

- [x] 2.1 Allow `threshold_rotation` through settings API validation and persistence
- [x] 2.2 Expose the routing mode in the dashboard settings UI and labels

## 3. Verification

- [x] 3.1 Add backend regression coverage for threshold rotation selection and settings updates
- [x] 3.2 Add frontend regression coverage for schemas, routing settings, labels, and mocks
- [x] 3.3 Run focused tests and note any unavailable local tooling
- [x] 3.4 Add regression coverage for threshold-rotation `codex_session` auto-switching
- [x] 3.5 Add regression coverage for threshold-rotation HTTP bridge session rebinding
