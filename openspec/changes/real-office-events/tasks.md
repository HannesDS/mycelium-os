## 1. Event log storage and API

- [x] 1.1 Add `events` table (or extend audit_log) with schema: shroom_id, event, to, topic, timestamp, payload_summary, metadata (JSONB), session_id
- [x] 1.2 Implement event persistence: write to events table whenever publishing to NATS (centralize in nats_client or event service)
- [x] 1.3 Add `GET /events` router with query params: shroom_id, session_id, topic, since, limit
- [x] 1.4 Add tests for GET /events (filtering, ordering, limit)

## 2. Approval NATS emit

- [x] 2.1 In approve_proposal and reject_proposal, after audit log and commit, call nats_bus.publish_event(ShroomEvent(decision_received, ...))
- [x] 2.2 Include metadata.approved and metadata.approval_id in emitted event
- [x] 2.3 Add test: approve/reject emits to NATS (mock NATS or integration test)

## 3. Trigger escalation API

- [x] 3.1 Add `POST /demo/trigger-escalation` endpoint: create Approval, emit escalation_raised + message_sent to NATS, return approval_id and summary
- [x] 3.2 Persist emitted events to events table
- [x] 3.3 Add test for trigger-escalation (creates approval, emits events)

## 4. Frontend event source and backfill

- [x] 4.1 Add backfill to startEventSource: on WS connect, call GET /events?limit=100, replay events in order, then process live WS
- [x] 4.2 Add deduplication by (shroom_id, event, timestamp) when overlap between backfill and live
- [x] 4.3 Handle WS unavailable: fallback to mock only when GET /events also fails (or document: no backfill when WS down)
- [x] 4.4 Add api.getEvents(limit?, since?) to frontend API client

## 5. Office refactor — real escalation flow

- [x] 5.1 Replace "Trigger escalation" button: call POST /demo/trigger-escalation instead of injectEvent
- [x] 5.2 Fetch pending approvals on trigger or poll: show HumanInboxCard with real approval from API (GET /approvals?status=pending)
- [x] 5.3 Replace approve/reject handlers: call POST /approvals/{id}/approve and POST /approvals/{id}/reject instead of injectEvent
- [x] 5.4 Remove injectEvent usage for escalation flow from ZenikOfficeCanvas
- [x] 5.5 Wire HumanInboxCard to display approval from API (approval_id, summary) and pass approval_id to approve/reject

## 6. Side panel and status from real events

- [x] 6.1 Replace getCurrentStatus, getCurrentTask, getEventsForShroom: derive from event stream state (in-memory event history from WS + backfill) instead of mock-event-loop
- [x] 6.2 Keep mock-event-loop for background chatter when WS unavailable (optional: or show "disconnected" state)

## 7. Execution pipeline (Phase 2 — optional)

- [ ] 7.1 Add POST /sessions/{session_id}/messages with body { content: string }
- [ ] 7.2 Invoke Agno for session's shroom; emit task_started before LLM, message_sent/escalation_raised after
- [ ] 7.3 Write each event to audit/events table before NATS publish
- [ ] 7.4 Add test for message execution flow
