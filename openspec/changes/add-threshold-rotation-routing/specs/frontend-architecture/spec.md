## ADDED Requirements
### Requirement: Routing settings expose threshold rotation
The Settings page routing section SHALL expose `threshold_rotation` as a routing strategy option so operators can enable the ordered quota-band mode from the dashboard after configuring the account order in environment settings.

#### Scenario: Save threshold rotation routing mode

- **WHEN** a user selects `threshold_rotation` in the routing settings section and saves
- **THEN** the app calls `PUT /api/settings` with `routingStrategy: "threshold_rotation"`
- **AND** the next settings read reflects `routingStrategy: "threshold_rotation"`
