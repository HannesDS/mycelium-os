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
