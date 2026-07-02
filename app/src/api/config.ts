/**
 * Resolves the backend base URL.
 *
 * Prefers the Expo public env var (`EXPO_PUBLIC_API_URL`) so it can differ per
 * environment without code changes. Falls back to the local backend default
 * (Express listens on port 4000, prefix `/api`). No secrets live here — only a
 * public base URL.
 *
 * Note: `babel-preset-expo` statically inlines `process.env.EXPO_PUBLIC_*` at
 * build time, so the pure resolution logic is extracted into
 * {@link resolveApiBaseUrl} to keep it testable independently of that inlining.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:4000/api';

export function resolveApiBaseUrl(raw: string | undefined): string {
  const trimmed = raw?.trim();
  // Guard against the literal string "undefined" produced by static inlining
  // when the env var is unset.
  const usable = trimmed && trimmed.length > 0 && trimmed !== 'undefined';
  const base = usable ? (trimmed as string) : DEFAULT_API_BASE_URL;
  // Normalise so callers can pass paths with or without a leading slash.
  return base.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
}
