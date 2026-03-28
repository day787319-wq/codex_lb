## 1. Backend account action

- [x] 1.1 Add an account API action that activates one selected account and pauses the other non-deactivated accounts
- [x] 1.2 Clear stale sticky-session and HTTP bridge affinity for non-selected accounts when exclusive activation runs
- [x] 1.3 Add backend regression coverage for the exclusive account action and affinity invalidation

## 2. Dashboard accounts UI

- [x] 2.1 Add a one-click `Use This Account Only` action in the account detail actions and dashboard account cards
- [x] 2.2 Wire the new action through frontend API and query invalidation

## 3. Verification

- [x] 3.1 Add or update frontend tests and MSW handlers for the new account action
- [ ] 3.2 Run focused backend tests, frontend tests, and OpenSpec validation
