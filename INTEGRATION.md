# Naqsha Frontend — Build Notes & Backend Integration Guide

This document records what was built and gives the backend contract you connect
to. It is split into:

1. [What was built](#1-what-was-built)
2. [How the data layer works (the swap point)](#2-how-the-data-layer-works)
3. [Read endpoints — already wired](#3-read-endpoints--already-wired) (just replace the mock body with `fetch`)
4. [Action / mutation endpoints — need wiring](#4-action--mutation-endpoints--need-wiring) (UI triggers exist; no api function yet)
5. [Realtime channel contract](#5-realtime-channel-contract)
6. [Domain types & currency notes](#6-domain-types--conventions)

> **Contract status:** the paths and payloads below are **proposals** — the
> backend contract was not frozen at build time. The frontend depends only on
> the **response *shapes*** (the domain types / Zod schemas), not on URLs. Adopt
> the shapes; the paths are yours to rename. When you change a URL you touch
> exactly one file in `src/lib/api/*`.

---

## 1. What was built

A single Vite + React 18 + TypeScript (strict) SPA serving all 11 screens from
`naqsha-mockups.html`, five role UIs:

| Sheet | Route | Screen |
|---|---|---|
| A-01 | `/waiter/tables` | Waiter floor / table select |
| A-02 | `/waiter/tables/:tableId` | Waiter menu + cart |
| K-01 | `/kds/:station` (`drinks`\|`main`\|`bbq`) | Kitchen display, palette-swapped per station |
| M-01 | `/manager/floor` | Manager floor (stat tiles + table grid) |
| M-02 | `/manager/kds` | Manager KDS aggregate (row per table) |
| M-03 | `/manager/pos/:tableId` | POS / bill / split / MOP |
| M-04 | `/manager/wastage` | Wastage entry form |
| M-05 | `/manager/cameras` | 4-cam grid (CSS placeholders) |
| O-01 | `/owner/dashboard` | Owner P&L dashboard |
| O-02 | `/owner/wastage` | Owner wastage approvals |
| C-01 | `/feedback/:tableSlug` | Customer feedback (public, no auth) |

Stack: Tailwind (tokens from the mockup), React Router v6 (every route a lazy
chunk), TanStack Query (server state), Zustand (cart + session), Zod (response
validation), date-fns, lucide-react. `/dev/components` is a dev-only gallery.

Out of scope (per handover): auth, admin/config surfaces, real Frappe calls.

---

## 2. How the data layer works

Nothing in the UI is coupled to endpoint shapes:

```
component / screen
   → hook (src/hooks/*)                     TanStack Query
      → api function (src/lib/api/*)         ← YOU EDIT ONLY HERE
         → mockGet(schema, mockData)         client.ts: delay + Zod parse
            → src/lib/mocks/*                delete once live
```

- **`src/types/domain.ts`** — ground-truth domain types (the shapes below).
- **`src/types/api.ts`** — Zod schemas; the runtime validation boundary.
- **`src/lib/api/client.ts`** — `mockGet` / `mockPost` (today: delay + validate mock).
- **`src/lib/api/*.ts`** — one file per feature; the functions in §3–4.

### The swap recipe

Each api function today looks like this:

```ts
// src/lib/api/orders.ts
export function getManagerTables(): Promise<Table[]> {
  return mockGet(z.array(TableSchema), MANAGER_TABLES);
}
```

To go live, keep the Zod parse, replace the source with a real request:

```ts
export async function getManagerTables(): Promise<Table[]> {
  const res = await fetch(`${API_BASE}/api/floor/tables?role=manager`, {
    headers: { /* auth token, etc. */ },
  });
  if (!res.ok) throw new Error(`floor ${res.status}`);
  return z.array(TableSchema).parse(await res.json()); // same schema, same return type
}
```

Hooks, components, types, and the query keys are untouched. If a real response
field name differs from the domain shape, translate it inside this function (map
the payload before `.parse`) — do **not** change the domain type. When every
endpoint is live, delete `src/lib/mocks/*`.

**Response validation is mandatory:** every response goes through its Zod schema
so a backend shape drift fails loudly at the boundary instead of rendering
`undefined` deep in a component.

---

## 3. Read endpoints — already wired

Each row is a function that exists today in `src/lib/api/*`, already validated by
a Zod schema and consumed by a hook. Swap the body per §2; nothing else changes.
`ORDER = ready → breach → normal` etc. is done client-side today — move sorting
server-side if you prefer (the frontend re-sort is harmless).

| Screen | Hook | api function (`src/lib/api/…`) | Suggested request | Response type · Zod schema |
|---|---|---|---|---|
| A-01 | `useWaiterTables` | `orders.getWaiterTables()` | `GET /floor/tables?role=waiter` | `Table[]` · `TableSchema` |
| A-01 | `useTakeawayOrders` | `orders.getTakeawayOrders()` | `GET /takeaway/active` | `TakeawayOrder[]` · `TakeawayOrderSchema` |
| A-02 | `useMenuCategories` | `orders.getMenuCategories()` | `GET /menu/categories` | `MenuCategory[]` · `MenuCategorySchema` |
| A-02 | `useMenuItems` | `orders.getMenuItems()` | `GET /menu/items` | `MenuItem[]` · `MenuItemSchema` |
| K-01 | `useKotStream(station)` | `kitchen.getKdsBoard(station)` | `GET /kds/{station}` (`drinks`\|`main`\|`bbq`) | `KdsBoard` · `KdsBoardSchema` |
| M-01 | `useManagerTables` | `orders.getManagerTables()` | `GET /floor/tables?role=manager` | `Table[]` · `TableSchema` |
| M-02 | `useAggregate` | `kitchen.getAggregateRows()` | `GET /kds/aggregate` | `AggregateRow[]` · `AggregateRowSchema` |
| M-03 | `useInvoice(tableRef)` | `pos.getInvoice(tableRef)` | `GET /pos/invoice?table={ref}` | `PosInvoice` · `PosInvoiceSchema` |
| O-01 | `useOwnerDashboard` | `owner.getOwnerDashboard()` | `GET /owner/dashboard?period=day` | `OwnerDashboard` · `OwnerDashboardSchema` |
| O-02 | `usePendingApprovals` | `wastage.getPendingApprovals()` | `GET /wastage/approvals?status=pending` | `Wastage[]` · `WastageSchema` |
| O-02 | `useApprovalCounts` | `wastage.getApprovalCounts()` | `GET /wastage/approvals/counts` | `{ pending, approved, rejected }` (add a schema when wired) |
| O-02 | `useWeekSummary` | `wastage.getWeekSummary()` | `GET /wastage/summary?range=week` | `{ rangeLabel, approvedValue, pendingValue }` (add a schema) |
| C-01 | `useFeedbackContext(slug)` | `feedback.getFeedbackContext(slug)` | `GET /feedback/context?t={slug}` | `FeedbackContext` · `FeedbackContextSchema` |

> `getApprovalCounts` / `getWeekSummary` currently return plain objects without
> Zod. When you wire them, add a `WastageCountsSchema` / `WastageWeekSchema` to
> `src/types/api.ts` and parse — keep the boundary consistent.

### Key response shapes (see `src/types/domain.ts` for the full set)

**`KdsBoard`** (K-01) — the whole station board in one call:
```ts
{
  meta: { station, name, stationId, slaSeconds, activeMax,
          avgPrepLabel, slaCompliancePct, totalPrepared },
  queue:    Kot[],   // state: 'queued'    (waitSeconds)
  active:   Kot[],   // state: 'preparing' | 'breach' (elapsedSeconds, slaSeconds)
  prepared: Kot[],   // state: 'prepared'  (doneSeconds, onTime)
}
// Kot: { ref, station, tableRef, items: {name, qty, comment?}[], state, slaSeconds, ... }
```

**`PosInvoice`** (M-03) — batches carry the "additional order" markers:
```ts
{
  ref, tableRef, tableNumber, pax, waiter: {id, name},
  openedAtLabel, durationLabel,
  batches: { label: string|null, lines: {qty,name,station,rate,amount}[] }[],
  subtotalItems, subtotal, serviceChargePct, serviceCharge,
  discount?, discountLabel?, grandTotal,
}
```

**`Table`** (A-01/M-01) carries both waiter and manager projections — `state`
drives card styling: `free | mine | occupied | active | breach | ready |
feedback | billing`. Manager cards additionally use `pax, waiter, kots[]
('pending'|'prep'|'done'), amount, actionTag, statusTag`.

---

## 4. Action / mutation endpoints — need wiring

These UI actions exist and are interactive locally, but have **no api function
yet** — they need a backend endpoint and a small `mockPost`-style wrapper. Only
`submitFeedback` is already wired end-to-end. Suggested contracts:

| Screen · action | Status | Suggested request | Request body → response |
|---|---|---|---|
| **C-01** · Send feedback | **wired** (`feedback.submitFeedback`, `useSubmitFeedback`) | `POST /feedback` | `FeedbackSubmission` `{ tableSlug, rating 1–5, likedDishes[], comment?, phone? }` → 201 |
| **A-02** · Submit order / Save draft | needs wiring | `POST /orders` / `PATCH /orders/{id}` | cart lines `{ itemId, qty, note? }[]` + `tableRef, pax` → created/updated invoice |
| **K-01** · Mark prepared / Collected | needs wiring | `POST /kds/kot/{ref}/advance` | `{ toState: 'preparing'|'prepared'|'collected' }` → updated `Kot` |
| **M-02** · Dispatch waiter / Escalate | needs wiring | `POST /kds/aggregate/{tableRef}/dispatch` (or `/escalate`) | `{ waiterId? }` → updated `AggregateRow` |
| **M-03** · Take payment / print | needs wiring | `POST /pos/invoice/{ref}/pay` | `{ mop: 'cash'|'card'|'wallet', split: number }` → settled invoice + receipt id |
| **M-04** · Send for approval / Save draft | needs wiring | `POST /wastage` / `PATCH /wastage/{ref}` | `{ reason, note?, items: {name,code,qty,uom,rate,amount}[] }` → created `Wastage` (status `pending`) |
| **O-02** · Approve / Reject / Ask info | needs wiring | `POST /wastage/{ref}/decision` | `{ decision: 'approve'|'reject'|'info', note? }` → updated `Wastage`; on approve, backend does the stock deduction |

**How to wire one** (mirror the feedback mutation):

```ts
// src/lib/api/wastage.ts
export function submitWastage(payload: WastageDraft): Promise<Wastage> {
  return mockPost(WastageDraftSchema, payload).then(/* … */); // → real POST
}
// src/hooks/useWastage.ts
export function useSubmitWastage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitWastage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wastage', 'pending'] }),
  });
}
```

Then call `.mutate(payload)` from the screen's button and invalidate the
relevant query keys (`['tables', …]`, `['kds', station]`, `['aggregate']`,
`['invoice', ref]`, `['wastage', …]`).

---

## 5. Realtime channel contract

`src/lib/realtime/socket.ts` is a stub with the exact surface the real socket
must implement:

```ts
subscribe(channel: string, handler: (payload: unknown) => void): () => void; // returns unsubscribe
```

Channels used today: `kds:drinks` · `kds:main` · `kds:bbq` · `kds:*` (wildcard,
used by the manager aggregate). The stub emits a `KotTick` every 8s:

```ts
{ type: 'kot.tick', station: 'drinks'|'main'|'bbq', ref: string, state: KotState, at: number }
```

The KDS board (`useKotStream`) and manager aggregate (`useAggregate`) simply
**invalidate their query on any tick**, then refetch through §3. So the real
socket only needs to fire an event on the right channel when a KOT changes — the
frontend re-pulls the authoritative board. Replace only this file (e.g. with a
WebSocket/SSE client); keep `subscribe`'s signature and the channel names.

---

## 6. Domain types & conventions

- **All types:** `src/types/domain.ts`. **All Zod schemas:** `src/types/api.ts`.
- **Currency:** amounts are **integer PKR** (no paisa) except wastage `rate`/
  `amount` which are 2-decimal cost values. Formatting (`₨ 3,320`, `−530`,
  `380.00`) lives in `src/lib/format.ts` — send raw numbers, not formatted
  strings. Exceptions: owner `miniStats.value` and a few narrative delta strings
  are intentionally pre-formatted display text.
- **Time:** durations are **seconds** (`slaSeconds`, `elapsedSeconds`,
  `waitSeconds`, `doneSeconds`); the UI formats `MM:SS`. Some fields are
  pre-formatted labels (`openedAtLabel`, `reportedAtLabel`) — fine to keep as
  strings, or send ISO timestamps and format client-side later.
- **Refs are the IDs:** `T-01`, `TAKE-041`, `KOT-D-1042`, `INV-C-2026-0231`,
  `WST-C-2026-0018` — the frontend treats these sheet-ref codes as source-of-
  truth identifiers throughout (route params, keys).
- **Stations** are the string union `'drinks' | 'main' | 'bbq'` everywhere.
- **Auth:** none yet. `src/stores/session.ts` returns a hard-coded identity per
  role. Add the token/session plumbing in the api functions' request headers
  when auth lands.
```
