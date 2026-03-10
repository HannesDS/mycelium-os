## ADDED Requirements

### Requirement: Sessions page renders at /sessions

The frontend SHALL provide a `/sessions` route that displays a sessions view with Active and Completed tabs.

#### Scenario: Sessions page loads with Active tab default

- **GIVEN** user navigates to `/sessions`
- **WHEN** page loads
- **THEN** Active tab SHALL be selected by default and SHALL display currently running shroom sessions

#### Scenario: Completed tab shows last 50 sessions

- **GIVEN** user is on `/sessions`
- **WHEN** user selects Completed tab
- **THEN** SHALL display up to 50 most recent completed sessions

### Requirement: Session list displays required columns

Each session row in the list SHALL display: session ID, shroom ID, status, start time, duration, message count.

#### Scenario: List row has all required fields

- **GIVEN** `GET /sessions` returns at least one session
- **WHEN** user views the session list
- **THEN** each row SHALL show session_id, shroom_id, status, started (ISO-8601 or humanized), duration, message_count

### Requirement: Clicking session opens detail view

The session list SHALL be clickable. Clicking a row SHALL open a detail view for that session.

#### Scenario: Navigate to session detail on row click

- **GIVEN** user is on `/sessions` with at least one session
- **WHEN** user clicks a session row
- **THEN** SHALL navigate to session detail view showing full message history and metadata

### Requirement: Session detail shows message history and metadata

The session detail view SHALL display full message history (user/assistant turns) and session metadata.

#### Scenario: Detail view shows message history

- **GIVEN** session has 3 message turns
- **WHEN** user views session detail
- **THEN** SHALL display all 3 turns in chronological order with role (user/assistant) and content

#### Scenario: Detail view shows metadata and linked events

- **WHEN** user views session detail
- **THEN** SHALL display shroom_id, model, session start/end, token count (if available), and links to related ShroomEvents in audit log

### Requirement: Active sessions auto-refresh

The Active tab SHALL refresh session data every 10 seconds without full page reload.

#### Scenario: Active tab refreshes periodically

- **GIVEN** user is on Active tab
- **WHEN** 10 seconds elapse
- **THEN** session list SHALL refetch from `GET /sessions?status=active` and update display

### Requirement: Storybook stories for session components

SessionList and SessionDetail components SHALL have Storybook stories.

#### Scenario: SessionList story renders

- **GIVEN** Storybook is running
- **WHEN** user opens SessionList story
- **THEN** SHALL render with mock session data

#### Scenario: SessionDetail story renders

- **GIVEN** Storybook is running
- **WHEN** user opens SessionDetail story
- **THEN** SHALL render with mock session and message history
