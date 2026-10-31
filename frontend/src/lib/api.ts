export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
  status: number;
};

function toApiError(status: number, body: unknown): ApiError {
  const err = (body as { error?: { code?: string; message?: string; fields?: Record<string, string> } })?.error;
  return {
    code: err?.code ?? "unknown_error",
    message: err?.message ?? `Request failed (${status})`,
    fields: err?.fields,
    status,
  };
}

export async function apiFetch<T>(path: string, init?: Omit<RequestInit, "body"> & { body?: unknown }): Promise<T> {
  const { body, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  } else if (body instanceof FormData) {
    payload = body;
  }
  const res = await fetch(`/api/v1${path}`, {
    ...rest,
    headers,
    body: payload,
    credentials: "same-origin",
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) {
    throw toApiError(res.status, json);
  }
  const data = (json as { data?: T })?.data;
  return (data ?? (json as T)) as T;
}

export async function apiServer<T>(path: string, revalidate?: number): Promise<T> {
  const origin = process.env.API_ORIGIN;
  if (!origin) throw new Error("API_ORIGIN is not set");
  const res = await fetch(`${origin}/api/v1${path}`, {
    next: revalidate !== undefined ? { revalidate } : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) {
    throw toApiError(res.status, json);
  }
  const data = (json as { data?: T })?.data;
  return (data ?? (json as T)) as T;
}