import type { CrmClient, CrmClientForm, CrmStats } from "./types";

interface ClientListParams {
  search?: string;
  status?: string;
  tag?: string;
  partner_id?: number;
}

function authHeaders() {
  const token = localStorage.getItem("cpr_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "CRM request failed");
  }
  return data as T;
}

export async function fetchCrmClients(params: ClientListParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  const response = await fetch(`/api/admin/crm/clients${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });

  return parseResponse<{ clients: CrmClient[]; stats: CrmStats }>(response);
}

export async function createCrmClient(client: CrmClientForm) {
  const response = await fetch("/api/admin/crm/clients", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(client),
  });

  return parseResponse<{ success: boolean; client: CrmClient }>(response);
}

export async function updateCrmClient(id: string, client: CrmClientForm) {
  const response = await fetch(`/api/admin/crm/clients/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(client),
  });

  return parseResponse<{ success: boolean; client: CrmClient }>(response);
}
