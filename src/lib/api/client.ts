import { useAuthStore } from "@/src/lib/stores/auth.store";

const API_BASE = "/api/v1";

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = (await res.json()) as ApiResponse<T> | ApiError;

  if (!json.success) {
    throw new ApiClientError(
      (json as ApiError).error.code,
      (json as ApiError).error.message,
      res.status
    );
  }

  return json as ApiResponse<T>;
}

// ── Convenience methods ────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
