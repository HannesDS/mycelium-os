## ADDED Requirements

### Requirement: Control plane exposes queryable event log

The control plane SHALL provide `GET /events` that returns ShroomEvents from an append-only event log. The endpoint SHALL support query parameters: `shroom_id`, `session_id`, `topic`, `since` (ISO-8601), `limit` (default 100, max 500).

#### Scenario: List recent events

- **GIVEN** at least 10 events exist in the event log
- **WHEN** client requests `GET /events?limit=10`
- **THEN** response SHALL return up to 10 most recent events in chronological order (oldest first for replay)

#### Scenario: Filter by shroom

- **GIVEN** events exist for `sales-shroom` and `ceo-shroom`
- **WHEN** client requests `GET /events?shroom_id=sales-shroom`
- **THEN** response SHALL return only events where `shroom_id` equals `sales-shroom`

#### Scenario: Filter by since timestamp

- **GIVEN** events exist with timestamps before and after `2026-03-11T10:00:00Z`
- **WHEN** client requests `GET /events?since=2026-03-11T10:00:00Z`
- **THEN** response SHALL return only events with `timestamp` >= the given value

#### Scenario: Event shape matches ShroomEvent schema

- **WHEN** client requests `GET /events`
- **THEN** each returned event SHALL include `shroom_id`, `event`, `to` (optional), `topic` (optional), `timestamp`, `payload_summary`, `metadata` (optional) per docs/design/SHROOM-EVENT-SCHEMA.md
