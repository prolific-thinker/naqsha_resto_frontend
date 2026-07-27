import type { ZodType } from 'zod';

/**
 * The Frappe-aware HTTP layer. Everything in lib/api/* goes through here.
 *
 * Four things about Frappe shape this file, and none of them are optional:
 *
 * 1. Responses are enveloped. Whitelisted methods return {"message": <payload>};
 *    /api/resource returns {"data": <payload>}. We unwrap both, once, centrally.
 * 2. Errors arrive as `_server_messages` — a JSON string containing a JSON array
 *    of JSON strings. Parsing it is the difference between showing a waiter
 *    "Table T-04 is not open" and showing them "[object Object]".
 * 3. Mutations require an X-Frappe-CSRF-Token header. Without it Frappe returns a
 *    hard 400, not a warning.
 * 4. Business failures come back as HTTP 200 with {ok:false, code}. They are not
 *    exceptions and must not be thrown — see `isFailure` below.
 */

export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** The Frappe site name; also the socket.io namespace. */
export const SITE_NAME = import.meta.env.VITE_SITE_NAME ?? '';

// ---------------------------------------------------------------------------
// CSRF
// ---------------------------------------------------------------------------
// Deliberately module state, not Zustand. It is transport plumbing: no component
// should re-render because of it, and it must never end up in a persisted store
// (the token rotates on login, so a stale persisted copy breaks every mutation).

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class FrappeHttpError extends Error {
  status: number;
  excType?: string;
  serverMessages: string[];
  payload: unknown;

  constructor(
    message: string,
    opts: { status: number; excType?: string; serverMessages?: string[]; payload?: unknown },
  ) {
    super(message);
    this.name = 'FrappeHttpError';
    this.status = opts.status;
    this.excType = opts.excType;
    this.serverMessages = opts.serverMessages ?? [];
    this.payload = opts.payload;
  }
}

/** The session is gone. Distinct from a permission error — see `request()`. */
export class FrappeAuthError extends FrappeHttpError {
  constructor(message = 'Your session has ended. Please sign in again.', status = 403) {
    super(message, { status });
    this.name = 'FrappeAuthError';
  }
}

/** Thrown by `unwrapOk` when a read returns a structured business failure. */
export class BusinessError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// The {ok:false} envelope
// ---------------------------------------------------------------------------

export type Failure = { ok: false; code: string; message: string; [k: string]: unknown };

export function isFailure(value: unknown): value is Failure {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { ok?: unknown }).ok === false &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

/**
 * For reads: turn a business failure into a thrown error so TanStack Query's
 * `isError` drives the ErrorState component.
 *
 * Mutations deliberately do NOT use this — they need to branch on `code`. That
 * asymmetry is the whole point: `advance_kot` returning ILLEGAL_TRANSITION means
 * a tablet was double-tapped, which must not raise an error toast.
 */
export function unwrapOk<T>(value: T | Failure): T {
  if (isFailure(value)) throw new BusinessError(value.code, value.message);
  return value as T;
}

// ---------------------------------------------------------------------------
// _server_messages
// ---------------------------------------------------------------------------

function stripHtml(input: string): string {
  if (!input.includes('<')) return input.trim();
  const doc = new DOMParser().parseFromString(input, 'text/html');
  return (doc.body.textContent ?? '').trim();
}

/** Frappe's triple-encoded error channel: a JSON string of a JSON array of JSON strings. */
export function parseServerMessages(payload: unknown): string[] {
  const raw = (payload as { _server_messages?: unknown } | null)?._server_messages;
  if (typeof raw !== 'string') return [];

  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [stripHtml(raw)].filter(Boolean);
  }
  if (!Array.isArray(arr)) return [];

  return arr
    .map((entry) => {
      if (typeof entry !== 'string') return String(entry);
      try {
        const obj = JSON.parse(entry) as { message?: unknown };
        return stripHtml(typeof obj?.message === 'string' ? obj.message : entry);
      } catch {
        return stripHtml(entry);
      }
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Unauthorized handling
// ---------------------------------------------------------------------------

let onUnauthorized: (() => void) | null = null;
let lastUnauthorizedAt = 0;

export function registerUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

function fireUnauthorized(): void {
  // Debounced: a screen firing six parallel queries would otherwise trigger six
  // redirects, which can loop.
  const now = Date.now();
  if (now - lastUnauthorizedAt < 2_000) return;
  lastUnauthorizedAt = now;
  onUnauthorized?.();
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export type AuthScope = 'session' | 'guest';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
  /**
   * 'guest' skips the dead-session probe and the force-logout. Use it for login,
   * auth.session itself, and every guest.* method — a 403 on those is an expected
   * answer, not a reason to sign a staff user out in another tab.
   */
  authScope?: AuthScope;
  _retriedCsrf?: boolean;
};

function buildQuery(query: Record<string, unknown> | undefined): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    // Frappe's own parse_json accepts the stringified form for list/dict args.
    params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Frappe returns HTML for some 500s and for the login page.
    return { _raw: text };
  }
}

function unwrapEnvelope(json: unknown): unknown {
  if (json && typeof json === 'object') {
    // `in` rather than truthiness: {"message": []} is a legitimately empty floor
    // and {"message": null} is a real answer from feedback_context.
    if ('message' in json) return (json as { message: unknown }).message;
    if ('data' in json) return (json as { data: unknown }).data;
  }
  return json;
}

const SESSION_METHOD = '/api/method/naqsha_pos.api.auth.session';

async function probeSession(): Promise<boolean> {
  try {
    const probe = await request<{ csrfToken?: string }>(SESSION_METHOD, { authScope: 'guest' });
    setCsrfToken(probe?.csrfToken ?? null);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const url = `${API_BASE}${path}${buildQuery(opts.query)}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    if (csrfToken) headers['X-Frappe-CSRF-Token'] = csrfToken;
  }

  const res = await fetch(url, {
    method,
    headers,
    // Always. The sid cookie is the session; without this nothing is authenticated.
    credentials: 'include',
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  const json = await readBody(res);

  if (res.ok) return unwrapEnvelope(json) as T;

  const serverMessages = parseServerMessages(json);
  const excType = (json as { exc_type?: string } | null)?.exc_type;
  const message =
    serverMessages[0] ??
    (json as { exception?: string } | null)?.exception ??
    `${method} ${path} → ${res.status}`;

  // A rotated CSRF token (login in another tab, worker restart) self-heals rather
  // than bricking every button on the page. Once only.
  const looksLikeCsrf = excType === 'CSRFTokenError' || /csrf/i.test(message);
  if (res.status === 400 && looksLikeCsrf && !opts._retriedCsrf) {
    const alive = await probeSession();
    if (alive) return request<T>(path, { ...opts, _retriedCsrf: true });
  }

  if ((res.status === 401 || res.status === 403) && (opts.authScope ?? 'session') === 'session') {
    // 403 is ambiguous: guards.require() raises PermissionError for an in-session
    // role violation, which is indistinguishable by status from a dead session.
    // One probe removes the ambiguity. Logging a user out for opening a screen
    // their role cannot see would be wrong.
    const alive = await probeSession();
    if (!alive) {
      fireUnauthorized();
      throw new FrappeAuthError(undefined, res.status);
    }
  }

  throw new FrappeHttpError(message, { status: res.status, excType, serverMessages, payload: json });
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

/** Call a whitelisted method: apiGet('naqsha_pos.api.floor.tables', {query:{scope:'all'}}) */
export function apiGet<T = unknown>(
  method: string,
  opts: Omit<RequestOptions, 'method' | 'body'> = {},
): Promise<T> {
  return request<T>(`/api/method/${method}`, { ...opts, method: 'GET' });
}

export function apiPost<T = unknown>(
  method: string,
  body?: unknown,
  opts: Omit<RequestOptions, 'method' | 'body'> = {},
): Promise<T> {
  return request<T>(`/api/method/${method}`, { ...opts, method: 'POST', body: body ?? {} });
}

export type ResourceQuery = {
  filters?: unknown[];
  fields?: string[];
  order_by?: string;
  limit_page_length?: number;
  /** REQUIRED when listing a child DocType, or permission resolution has no parent. */
  parent?: string;
};

export function resourceList<T = unknown>(doctype: string, params: ResourceQuery = {}): Promise<T[]> {
  return request<T[]>(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: 'GET',
    query: { limit_page_length: 0, ...params } as Record<string, unknown>,
  });
}

export function resourceGet<T = unknown>(doctype: string, name: string): Promise<T> {
  return request<T>(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    method: 'GET',
  });
}

export function resourceCreate<T = unknown>(doctype: string, doc: object): Promise<T> {
  return request<T>(`/api/resource/${encodeURIComponent(doctype)}`, { method: 'POST', body: doc });
}

export function resourceUpdate<T = unknown>(doctype: string, name: string, patch: object): Promise<T> {
  return request<T>(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: patch,
  });
}

// ---------------------------------------------------------------------------
// Legacy shims
// ---------------------------------------------------------------------------
// src/lib/api/erp.ts still runs on mocks (inventory, purchasing, CRM, reports,
// staff). These keep it compiling untouched until those screens are wired.

export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false';

export async function httpGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  const json = await request<unknown>(path, { method: 'GET' });
  return schema.parse(json);
}

export async function httpPost<T>(path: string, body: unknown, schema: ZodType<T>): Promise<T> {
  const json = await request<unknown>(path, { method: 'POST', body });
  return schema.parse(json);
}
