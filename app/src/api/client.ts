import { getApiBaseUrl } from './config';
import { ApiError } from './errors';

/**
 * Unified response envelope returned by every backend endpoint.
 * Mirrors the backend contract: `{ success: true, data }` on success,
 * `{ success: false, error }` on failure.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// A JSON-serialisable request body. `object` (rather than
// `Record<string, unknown>`) so typed domain interfaces are accepted without
// an explicit index signature; the body is only ever JSON.stringify-d.
type Json = object;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Json;
  signal?: AbortSignal;
  baseUrl?: string;
  headers?: Record<string, string>;
}

type ApiAuthTokens =
  | string
  | {
      accessToken?: string | null;
      identityToken?: string | null;
    };
type AccessTokenProvider = () => Promise<ApiAuthTokens | null | undefined>;

let accessTokenProvider: AccessTokenProvider | null = null;

export function setApiAccessTokenProvider(provider: AccessTokenProvider | null): void {
  accessTokenProvider = provider;
}

function authHeaders(authTokens: ApiAuthTokens | null | undefined): Record<string, string> {
  if (!authTokens) {
    return {};
  }
  if (typeof authTokens === 'string') {
    return authTokens ? { Authorization: `Bearer ${authTokens}` } : {};
  }
  return {
    ...(authTokens.accessToken ? { Authorization: `Bearer ${authTokens.accessToken}` } : {}),
    ...(authTokens.identityToken
      ? { 'X-Privy-Identity-Token': authTokens.identityToken }
      : {})
  };
}

function buildUrl(path: string, baseUrl: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${suffix}`;
}

async function parseEnvelope<T>(response: Response): Promise<T | undefined> {
  // 204 (e.g. successful DELETE) carries no body.
  if (response.status === 204) {
    return undefined;
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success !== true) {
    const message =
      payload?.error ?? `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return payload.data;
}

/**
 * Typed fetch wrapper around the backend API.
 *
 * Returns the unwrapped `data` payload on success and throws {@link ApiError}
 * on any non-success response, so callers work with domain data directly.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T | undefined> {
  const {
    method = 'GET',
    body,
    signal,
    baseUrl = getApiBaseUrl(),
    headers
  } = options;
  const shouldAttachAccessToken = baseUrl === getApiBaseUrl() && !headers?.Authorization;
  const authTokens = shouldAttachAccessToken ? await accessTokenProvider?.() : undefined;

  const response = await fetch(buildUrl(path, baseUrl), {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : undefined),
      ...authHeaders(authTokens),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return parseEnvelope<T>(response);
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal): Promise<T | undefined> =>
    request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body: Json, signal?: AbortSignal): Promise<T | undefined> =>
    request<T>(path, { method: 'POST', body, signal }),
  postWithHeaders: <T>(
    path: string,
    body: Json,
    headers: Record<string, string>,
    signal?: AbortSignal
  ): Promise<T | undefined> =>
    request<T>(path, { method: 'POST', body, headers, signal }),
  put: <T>(path: string, body: Json, signal?: AbortSignal): Promise<T | undefined> =>
    request<T>(path, { method: 'PUT', body, signal }),
  patch: <T>(path: string, body: Json, signal?: AbortSignal): Promise<T | undefined> =>
    request<T>(path, { method: 'PATCH', body, signal }),
  delete: (path: string, signal?: AbortSignal): Promise<void> =>
    request<void>(path, { method: 'DELETE', signal }).then(() => undefined)
} as const;
