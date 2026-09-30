const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let onSessionExpired: () => void = () => {};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
  details?: unknown;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });
}

// Single-flight: concurrent 401s share one refresh, since the backend rotates
// the refresh token and treats reuse as theft.
let refreshing: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const res = await send('/auth/refresh-token', { method: 'POST' });
      if (!res.ok) return null;
      const body = (await res.json()) as Envelope<{ accessToken: string }>;
      accessToken = body.data.accessToken;
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function request<T = void>(
  path: string,
  init: RequestInit & { json?: unknown; skipRefresh?: boolean } = {},
): Promise<T> {
  const { json, skipRefresh, ...rest } = init;
  if (json !== undefined) rest.body = JSON.stringify(json);

  let res = await send(path, rest);
  if (res.status === 401 && !skipRefresh) {
    if (await refreshAccessToken()) {
      res = await send(path, rest);
    } else {
      accessToken = null;
      onSessionExpired();
    }
  }

  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body) {
    throw new ApiError(res.status, body?.message ?? res.statusText, body?.details);
  }
  return body.data;
}
