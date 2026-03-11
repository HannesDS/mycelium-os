const API_BASE =
  process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://localhost:8000";

export interface ShroomSummary {
  id: string;
  name: string;
  model: string;
  skills: string[];
  escalates_to: string | null;
  status: string;
}

export interface ShroomDetail {
  id: string;
  name: string;
  model: string;
  skills: string[];
  escalates_to: string | null;
  sla_response_minutes: number | null;
  can: Record<string, string[]>[];
  cannot: Record<string, string[]>[];
  mcps: string[];
  status: string;
}

export interface ApprovalItem {
  id: string;
  shroom_id: string;
  event_type: string;
  summary: string;
  payload: Record<string, unknown> | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export async function fetchShrooms(): Promise<ShroomSummary[]> {
  const res = await fetch(`${API_BASE}/shrooms`);
  if (!res.ok) {
    throw new Error(`Failed to fetch shrooms: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchShroom(id: string): Promise<ShroomDetail> {
  const res = await fetch(`${API_BASE}/shrooms/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch shroom ${id}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPendingApprovalCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/approvals/pending-count`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch pending count: ${res.status} ${res.statusText}`,
    );
  }
  const data = await res.json();
  return data.count as number;
}

export async function fetchApprovals(
  status?: string,
): Promise<ApprovalItem[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_BASE}/approvals${params}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch approvals: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function approveProposal(id: string): Promise<ApprovalItem> {
  const res = await fetch(`${API_BASE}/approvals/${id}/approve`, {
    method: "POST",
  });
  if (res.status === 409) {
    const body = await res.json();
    throw new ConflictError(body.detail);
  }
  if (!res.ok) {
    throw new Error(`Failed to approve: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function rejectProposal(id: string): Promise<ApprovalItem> {
  const res = await fetch(`${API_BASE}/approvals/${id}/reject`, {
    method: "POST",
  });
  if (res.status === 409) {
    const body = await res.json();
    throw new ConflictError(body.detail);
  }
  if (!res.ok) {
    throw new Error(`Failed to reject: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface ShroomEventItem {
  shroom_id: string;
  event: string;
  to: string | null;
  topic: string | null;
  timestamp: string;
  payload_summary: string;
  metadata: Record<string, unknown> | null;
}

export interface TriggerEscalationResponse {
  approval_id: string;
  summary: string;
}

export async function triggerEscalation(): Promise<TriggerEscalationResponse> {
  const res = await fetch(`${API_BASE}/demo/trigger-escalation`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(
      `Failed to trigger escalation: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export async function getEvents(
  options?: { limit?: number; since?: string }
): Promise<ShroomEventItem[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.since) params.set("since", options.since);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/events${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export interface ShroomManifestDetail {
  name: string;
  model: string;
  skills: string[];
  escalates_to: string | null;
  sla_response_minutes: number | null;
  can: Record<string, string[]>[];
  cannot: Record<string, string[]>[];
  mcps: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

export interface ConstitutionData {
  company: { name: string; instance: string };
  shrooms: { id: string; manifest: ShroomManifestDetail }[];
  graph: { edges: GraphEdge[] };
}

export async function fetchConstitution(): Promise<ConstitutionData> {
  const res = await fetch(`${API_BASE}/constitution`);
  if (!res.ok) {
    throw new Error(`Failed to fetch constitution: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface ShroomMessageResponse {
  shroom_id: string;
  response: string;
  session_id?: string;
}

export interface OrgGraphNode {
  id: string;
  name: string;
  role: string;
  tags: string[];
  model: string;
  capabilities: Record<string, string[]>;
  escalates_to: string | null;
  sla_response_minutes: number | null;
}

export interface OrgGraphEdge {
  from: string;
  to: string;
  type: string;
  metadata: Record<string, unknown>;
}

export interface OrgGraph {
  nodes: OrgGraphNode[];
  edges: OrgGraphEdge[];
  layout_hints: Record<string, unknown>;
}

export interface OrgActivityMetrics {
  window_seconds: number;
  events_total: number;
  tasks_started: number;
  tasks_completed: number;
  escalations_raised: number;
  errors: number;
}

export interface OrgActivityState {
  shroom_id: string;
  status: string;
  last_event: Record<string, unknown> | null;
  metrics_window: OrgActivityMetrics;
}

export interface OrgGraphResponse {
  graph: OrgGraph;
  activity: OrgActivityState[];
}

export async function fetchOrgGraph(): Promise<OrgGraphResponse> {
  const res = await fetch(`${API_BASE}/org/graph`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch org graph: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

export interface SessionListItem {
  session_id: string;
  shroom_id: string;
  status: string;
  started: string;
  duration: string;
  message_count: number;
}

export interface SessionDetail {
  session_id: string;
  shroom_id: string;
  message_history: { role: string; content: string }[];
  started: string;
  ended: string | null;
  model: string | null;
  token_count: number | null;
  related_events: {
    id: string;
    entity_type?: string;
    action: string;
    actor: string;
    created_at: string;
  }[];
}

export async function fetchSessions(
  status: "active" | "completed" = "active",
): Promise<{ sessions: SessionListItem[] }> {
  const res = await fetch(
    `${API_BASE}/sessions?status=${encodeURIComponent(status)}`,
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch sessions: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch session ${id}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function sendMessage(
  shroomId: string,
  message: string,
): Promise<ShroomMessageResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(
      `${API_BASE}/shrooms/${encodeURIComponent(shroomId)}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      let detail: string;
      try {
        const body = await res.json();
        detail = body.detail || `${res.status} ${res.statusText}`;
      } catch {
        detail = `${res.status} ${res.statusText}`;
      }
      throw new Error(`Failed to send message to ${shroomId}: ${detail}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Shroom is taking too long to respond. Try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
