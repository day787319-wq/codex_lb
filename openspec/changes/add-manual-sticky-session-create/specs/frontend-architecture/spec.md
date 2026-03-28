## ADDED Requirements
### Requirement: Settings page can create sticky-session mappings manually
The Settings page SHALL let an operator create or replace sticky-session mappings without leaving the dashboard.

#### Scenario: Create a sticky-session mapping from Settings

- **WHEN** a user enters a sticky-session key, chooses a kind, selects an account, and saves the form
- **THEN** the app calls the sticky-session create API
- **AND** refreshes the sticky-session list after the save succeeds
