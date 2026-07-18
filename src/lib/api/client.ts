import type { ZodType } from 'zod';

/**
 * The single request shim. Today it validates in-memory mock data with a
 * simulated network delay; when the real contract lands, this is where fetch
 * goes — every endpoint in lib/api/* routes through here, so the swap is local
 * (handover §7).
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(min = 100, max = 400): number {
  return Math.floor(min + Math.random() * (max - min));
}

/** Resolve mock `data` after a realistic delay, validated by its Zod schema. */
export async function mockGet<T>(schema: ZodType<T>, data: unknown): Promise<T> {
  await delay(jitter());
  return schema.parse(data);
}

/** Simulate a mutation: validate the payload, delay, echo it back. */
export async function mockPost<TReq>(schema: ZodType<TReq>, payload: unknown): Promise<TReq> {
  const parsed = schema.parse(payload);
  await delay(jitter(150, 500));
  return parsed;
}
