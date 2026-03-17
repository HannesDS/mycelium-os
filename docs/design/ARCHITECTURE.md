# Mycelium OS — Architecture

## System overview

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI[Next.js UI]
        Canvas[Visual Office Canvas]
    end

    subgraph Frontend["Next.js (frontend)"]
        Proxy["/api/control-plane/*"]
        UI --> Proxy
        Canvas --> Proxy
    end

    subgraph ControlPlane["Control Plane (FastAPI)"]
        API[REST API]
        WS[WebSocket /ws/events]
        Auth[get_principal]
        Controller[ShroomController]
        NATS[NATS Client]
        DB[(Postgres)]
        Neo4j[(Neo4j)]
    end

    subgraph DataPlane["Data Plane"]
        Agno[Agno Runtime]
        Shroom1[sales-shroom]
        Shroom2[root-shroom]
        Shroom3[billing-shroom]
        Tools[web_browser, etc.]
    end

    subgraph External["External"]
        Ollama[Ollama]
        OpenRouter[OpenRouter]
    end

    Proxy -->|"X-API-Key (server env)"| API
    Canvas -->|"direct"| WS
    API --> Auth
    API --> Controller
    API --> DB
    Controller --> Agno
    Controller --> NATS
    Controller --> Neo4j
    Agno --> Shroom1
    Agno --> Shroom2
    Agno --> Shroom3
    Shroom1 --> Tools
    Agno --> Ollama
    Agno --> OpenRouter
    NATS --> WS
```

## Request flow

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js
    participant ControlPlane as Control Plane
    participant DB as Postgres
    participant NATS

    Note over Browser,NATS: Authenticated requests (events, sessions, message, demo)
    Browser->>NextJS: POST /api/control-plane/shrooms/x/message
    NextJS->>NextJS: Add X-API-Key from DEV_API_KEY
    NextJS->>ControlPlane: Forward to CONTROL_PLANE_URL
    ControlPlane->>ControlPlane: get_principal validates key
    ControlPlane->>DB: Session binding
    ControlPlane->>ControlPlane: Agno run
    ControlPlane->>DB: Audit log
    ControlPlane->>NATS: Publish event
    ControlPlane-->>NextJS: Response
    NextJS-->>Browser: Response

    Note over Browser,NATS: WebSocket (real-time events)
    Browser->>ControlPlane: WS /ws/events (direct)
    ControlPlane->>NATS: Subscribe
    NATS-->>ControlPlane: Event
    ControlPlane-->>Browser: Event
```

## Two planes

```mermaid
flowchart LR
    subgraph ControlPlane["Control Plane"]
        direction TB
        Constitution[mycelium.yaml]
        Graph[Neo4j Graph]
        Escalation[Escalation Engine]
        Inbox[Approvals Inbox]
        Audit[Audit Log]
        Events[Event Log]
    end

    subgraph DataPlane["Data Plane"]
        direction TB
        Sandbox[Shroom Sandboxes]
        Tools[Tool Execution]
        MCP[MCP Connectors]
        Storage[MinIO]
    end

    ControlPlane -->|"governs"| DataPlane
```

## Core concepts

```mermaid
classDiagram
    class Constitution {
        +company
        +shrooms[]
        +graph
    }

    class ShroomManifest {
        +id
        +role
        +model
        +can[]
        +cannot[]
        +escalates_to
        +skills[]
    }

    class ShroomEvent {
        +shroom_id
        +event
        +to
        +topic
        +timestamp
        +payload_summary
        +metadata
    }

    class SessionBinding {
        +principal_id
        +shroom_id
        +session_id
    }

    class Approval {
        +id
        +shroom_id
        +event_type
        +summary
        +payload
        +status
    }

    class ShroomEventRecord {
        +shroom_id
        +event
        +session_id
        +payload_summary
        +metadata
    }

    Constitution --> ShroomManifest : contains
    ShroomManifest --> ShroomEvent : emits
    SessionBinding --> ShroomEvent : scopes
    ShroomEvent --> ShroomEventRecord : persisted
    ShroomEvent --> Approval : may create
```

## Tech stack

```mermaid
flowchart TB
    subgraph Frontend["Frontend"]
        Next[Next.js 14]
        React[React]
        Konva[Konva]
        Next --> React
        React --> Konva
    end

    subgraph ControlPlane["Control Plane"]
        FastAPI[FastAPI]
        Pydantic[Pydantic]
        Agno[Agno]
        FastAPI --> Pydantic
        FastAPI --> Agno
    end

    subgraph Infra["Infrastructure"]
        Postgres[(PostgreSQL)]
        Neo4j[(Neo4j)]
        NATS[NATS]
        MinIO[MinIO]
    end

    subgraph Models["Models"]
        Ollama[Ollama]
        OpenRouter[OpenRouter]
    end

    Frontend --> ControlPlane
    ControlPlane --> Infra
    ControlPlane --> Models
```

## Event flow

```mermaid
flowchart LR
    Shroom[Shroom Activity]
    Emit[emit_event]
    Audit[Audit Log]
    NATS[NATS]
    Relay[WS Relay]
    WS[WebSocket]
    Frontend[Frontend]

    Shroom --> Emit
    Emit --> Audit
    Emit --> NATS
    NATS --> Relay
    Relay --> WS
    WS --> Frontend
```

## API routes

```mermaid
flowchart TB
    subgraph Public["Public (no auth)"]
        Shrooms[/shrooms]
        Shroom[/shrooms/:id]
        Constitution[/constitution]
        Skills[/skills]
        Org[/org/graph]
    end

    subgraph Protected["Protected (X-API-Key)"]
        Events[/events]
        Sessions[/sessions]
        Message[/shrooms/:id/message]
        Demo[/demo/trigger-escalation]
        Approvals[/approvals]
    end

    subgraph WebSocket["WebSocket"]
        WSEvents[/ws/events]
    end
```

## Security

```mermaid
flowchart TB
    subgraph Client["Browser"]
        Fetch[fetch /api/control-plane/*]
    end

    subgraph NextJS["Next.js (server)"]
        Proxy[API Route]
        Env[DEV_API_KEY]
        Proxy --> Env
    end

    subgraph ControlPlane["Control Plane"]
        Auth[get_principal]
        Principal[principal_id]
    end

    Fetch --> Proxy
    Proxy -->|"X-API-Key"| ControlPlane
    Auth --> Principal
    Auth -->|"401 if no key"| Reject[Reject]

    style Env fill:#90EE90
    style Reject fill:#FFB6C1
```

**Key:** API key never leaves the server. `DEV_API_KEY` is server-only; `NEXT_PUBLIC_*` is never used for secrets.
