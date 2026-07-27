/**
 * Idempotency keys for the two write paths that accept one: `order.submit_order`
 * and `billing.pay_invoice`.
 *
 * The rule: **generated once at the user's tap, stored with the intent, reused for
 * every retry, discarded only on terminal success.**
 *
 * Where it lives matters. TanStack Query re-invokes `mutationFn` with the SAME
 * `variables` on retry — so a ref held in `variables` makes every retry automatically
 * idempotent, while a ref generated *inside* `mutationFn` defeats the whole mechanism
 * by minting a new one each attempt. Keep it in the store that owns the intent
 * (the cart, the payment screen), never in the mutation.
 *
 * Server side: both methods look the ref up first and return the existing document
 * with `replayed: true`; a unique index catches the race. `replayed` is plain success,
 * not a warning.
 */
export function makeRef(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${uuid}`;
}
