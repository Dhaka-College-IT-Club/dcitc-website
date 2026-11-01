export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
  status: number;
  retryAfter?: number;
};

function toApiError(status: number, body: unknown, retryAfter?: number): ApiError {
  const err = (body as { error?: { code?: string; message?: string; fields?: Record<string, string> } })?.error;
  return {
    code: err?.code ?? "unknown_error",
    message: err?.message ?? `Request failed (${status})`,
    fields: err?.fields,
    status,
    retryAfter,
  };
}

export async function apiFetch<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown; timeoutMs?: number }
): Promise<T> {
  const { body, timeoutMs = 15_000, signal: callerSignal, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  } else if (body instanceof FormData) {
    payload = body;
  }
  // One deadline everywhere; a caller signal is merged only when supplied.
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, AbortSignal.timeout(timeoutMs)])
    : AbortSignal.timeout(timeoutMs);

  try {
    const res = await fetch(`/api/v2${path}`, {
      ...rest,
      headers,
      body: payload,
      credentials: "same-origin",
      signal,
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
      const retryAfter = Number(res.headers.get("Retry-After"));
      throw toApiError(res.status, json, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
    }
    const data = (json as { data?: T })?.data;
    return (data ?? (json as T)) as T;
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    if (name === "AbortError" || name === "TimeoutError") {
      throw {
        code: "timeout",
        message: "The request timed out. Check your connection and try again.",
        status: 0,
      } satisfies ApiError;
    }
    throw error;
  }
}

export async function apiServer<T>(path: string, revalidate?: number): Promise<T> {
  const origin = process.env.API_ORIGIN;
  if (!origin) throw new Error("API_ORIGIN is not set");
  const res = await fetch(`${origin}/api/v2${path}`, {
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