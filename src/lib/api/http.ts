import type { ZodType } from 'zod';

/**
 * Real HTTP layer. When VITE_USE_MOCKS is 'false', the api functions in this
 * folder route through here instead of the mock shim (src/lib/api/client.ts).
 * Every response is still parsed by its Zod schema at the boundary.
 */

export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Mocks are the default; only an explicit 'false' opts into real HTTP. */
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false';

function headers(): HeadersInit {
  // TODO: add the session token / branch header here when auth lands
  // (identity currently stubbed in src/stores/session.ts).
  return { 'Content-Type': 'application/json' };
}

export async function httpGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return schema.parse(await res.json());
}

export async function httpPost<T>(path: string, body: unknown, schema: ZodType<T>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return schema.parse(await res.json());
}
