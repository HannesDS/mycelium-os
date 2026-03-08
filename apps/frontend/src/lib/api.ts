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
