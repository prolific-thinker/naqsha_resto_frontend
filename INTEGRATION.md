# Naqsha Frontend — Backend Integration & Owner's Guide

> This is **your** working document. Study it, edit it, rename endpoints to match
> your backend, and fill the `TODO(you)` markers. It covers: how to point the app
> at your backend, the full API endpoint list, the data-flow hierarchy, the
> response contracts, realtime, and conventions.

**Contract status:** paths below are *suggestions*. The frontend depends on
response **shapes** (the domain types / Zod schemas), not URLs. Rename any path
in **`src/lib/api/endpoints.ts`** — one file — and the app follows.

---

## 0. Connect it to your backend (2 steps)

```bash
cp .env.example .env.local
```

```dotenv
# .env.local
VITE_API_BASE=https://your-backend.example/api   # TODO(you): your base URL, no trailing slash
VITE_USE_MOCKS=false                              # false → real HTTP; true/unset → in-memory mocks
```

That's it. With `VITE_USE_MOCKS=false`, every wired read endpoint hits
`VITE_API_BASE + <path from endpoints.ts>` and validates the JSON against its Zod
schema. Leave it `true` (or unset) to keep developing against mocks with no
backend running.

- **Where paths live:** `src/lib/api/endpoints.ts` (rename freely).
- **Where the switch lives:** `src/lib/api/http.ts` (`USE_MOCKS`, `API_BASE`, auth header `TODO(you)`).
- **Auth:** none yet. Add your session token/branch header in `http.ts → headers()`.

---

## 1. Data-flow hierarchy

### Request flow (what happens on load)

```
Screen (src/routes/**)
  │  calls a hook
  ▼
Hook (src/hooks/*)  ── TanStack Query: caching, loading/error, query keys
  │  calls an api function
  ▼
api function (src/lib/api/*.ts)
  │
  ├─ USE_MOCKS = true  ─► mockGet(schema, mockData)     client.ts  (delay + Zod parse)
  │                         └─ src/lib/mocks/*           ← delete when fully live
  │
  └─ USE_MOCKS = false ─► httpGet(ENDPOINTS.x(), schema) http.ts    (fetch + Zod parse)
                            └─ VITE_API_BASE + path      ← YOUR BACKEND
  ▼
Zod schema (src/types/api.ts) validates the response  ── the safety boundary
  ▼
Domain type (src/types/domain.ts) returned to the hook → screen renders
```

**One rule:** components/hooks/types never change when the backend lands — you
only edit `endpoints.ts` (paths) and, if a real field name differs, map it inside
the relevant `src/lib/api/*.ts` function *before* `.parse`.

### Realtime flow (KDS / aggregate stay live)

```
backend event ─► subscribe('kds:<station>', handler)   src/lib/realtime/socket.ts
                    │
                    ▼
              hook invalidates its query (useKotStream / useAggregate)
                    ▼
              TanStack Query refetches the board via §2  → UI updates
```

### App / render hierarchy

```
main.tsx ─ QueryClientProvider ─ BrowserRouter
  └─ App.tsx  (lazy route table, one chunk per route)
      ├─ routes/waiter/*        → WaiterShell
      ├─ routes/kds/*           → KdsShell
      ├─ routes/manager/*       → ManagerShell (NavRail)
      ├─ routes/owner/*         → OwnerShell
      └─ routes/feedback/*      → PhoneShell
components/  naqsha/ (design primitives) · ui/ (form controls) · table/ kot/ bill/ · layouts/
stores/      cart.ts · session.ts   (Zustand)
```

---

## 2. API endpoints — READ (wired: mock↔http switch already in place)

Rename paths in `endpoints.ts`; return the listed shape. `?role=`, `?period=`,
`?status=`, `?range=` are suggestions — adapt to your query style.

| # | Method · Path (`endpoints.ts` key) | Screen · Hook | Returns (Zod schema) |
|---|---|---|---|
| 1 | `GET /floor/tables?role=waiter` · `waiterTables` | A-01 · `useWaiterTables` | `Table[]` · `TableSchema` |
| 2 | `GET /floor/tables?role=manager` · `managerTables` | M-01 · `useManagerTables` | `Table[]` · `TableSchema` |
| 3 | `GET /takeaway/active` · `takeaway` | A-01 · `useTakeawayOrders` | `TakeawayOrder[]` · `TakeawayOrderSchema` |
| 4 | `GET /menu/categories` · `menuCategories` | A-02 · `useMenuCategories` | `MenuCategory[]` · `MenuCategorySchema` |
| 5 | `GET /menu/items` · `menuItems` | A-02 · `useMenuItems` | `MenuItem[]` · `MenuItemSchema` |
| 6 | `GET /kds/{station}` · `kdsBoard` | K-01 · `useKotStream` | `KdsBoard` · `KdsBoardSchema` |
| 7 | `GET /kds/aggregate` · `kdsAggregate` | M-02 · `useAggregate` | `AggregateRow[]` · `AggregateRowSchema` |
| 8 | `GET /pos/invoice?table={ref}` · `invoice` | M-03 · `useInvoice` | `PosInvoice` · `PosInvoiceSchema` |
| 9 | `GET /owner/dashboard?period=day` · `ownerDashboard` | O-01 · `useOwnerDashboard` | `OwnerDashboard` · `OwnerDashboardSchema` |
| 10 | `GET /wastage/approvals?status=pending` · `wastagePending` | O-02 · `usePendingApprovals` | `Wastage[]` · `WastageSchema` |
| 11 | `GET /wastage/approvals/counts` · `wastageCounts` | O-02 · `useApprovalCounts` | `{pending,approved,rejected}` · `WastageCountsSchema` |
| 12 | `GET /wastage/summary?range=week` · `wastageWeek` | O-02 · `useWeekSummary` | `{rangeLabel,approvedValue,pendingValue}` · `WastageWeekSchema` |
| 13 | `GET /feedback/context?t={slug}` · `feedbackContext` | C-01 · `useFeedbackContext` | `FeedbackContext` · `FeedbackContextSchema` |

`{station}` ∈ `drinks | main | bbq`. Aggregate (#7) is re-sorted client-side by
readiness — server order doesn't matter.

## 3. API endpoints — WRITE

`submitFeedback` is fully wired. The rest have UI triggers but need a small
mutation wrapper (pattern in §5). Paths are already in `endpoints.ts`.

| Method · Path (`endpoints.ts` key) | Screen · action | Request body → response |
|---|---|---|
| `POST /feedback` · `submitFeedback` **(wired)** | C-01 · Send feedback | `{tableSlug, rating 1–5, likedDishes[], comment?, phone?}` → echo/201 |
| `POST /orders` · `submitOrder` | A-02 · Submit order | `{tableRef, pax, lines:[{itemId,qty,note?}]}` → created `PosInvoice` |
| `PATCH /orders/{invoiceRef}` · `updateOrder` | A-02 · Save draft / add batch | same as above → updated `PosInvoice` |
| `POST /kds/kot/{kotRef}/advance` · `advanceKot` | K-01 · Mark prepared / Collected | `{toState:'preparing'\|'prepared'\|'collected'}` → updated `Kot` |
| `POST /kds/aggregate/{tableRef}/dispatch` · `dispatchTable` | M-02 · Dispatch / Escalate | `{waiterId?}` → updated `AggregateRow` |
| `POST /pos/invoice/{invoiceRef}/pay` · `payInvoice` | M-03 · Take payment | `{mop:'cash'\|'card'\|'wallet', split:number}` → settled invoice + receipt id |
| `POST /wastage` · `submitWastage` | M-04 · Send for approval | `{reason, note?, items:[{name,code,qty,uom,rate,amount}]}` → created `Wastage` (`pending`) |
| `POST /wastage/{wastageRef}/decision` · `decideWastage` | O-02 · Approve/Reject/Ask | `{decision:'approve'\|'reject'\|'info', note?}` → updated `Wastage`; **approve triggers stock deduction server-side** |

---

## 4. Response shapes (see `src/types/domain.ts` for the full, authoritative set)

**`Table`** (#1,#2) — `state` drives the card. Waiter cards use `state, meta,
statusTag`; manager cards add `pax, waiter, kots[], amount, actionTag`.
```ts
state: 'free'|'mine'|'occupied'|'active'|'breach'|'ready'|'feedback'|'billing'
kots:  ('pending'|'prep'|'done')[]      // progress pips
```

**`KdsBoard`** (#6) — the whole station in one call:
```ts
{ meta:{station,name,stationId,slaSeconds,activeMax,avgPrepLabel,slaCompliancePct,totalPrepared},
  queue:Kot[], active:Kot[], prepared:Kot[] }
// Kot: {ref,station,tableRef,items:{name,qty,comment?}[],state,slaSeconds,
//       waitSeconds?,elapsedSeconds?,doneSeconds?,onTime?}
```

**`AggregateRow`** (#7):
```ts
{ tableRef, tableNumber, rowState:'ready'|'breach'|'normal',
  stations:{station,items,status:'queued'|'prep'|'ready'|'none',statusLabel,overSla?}[],
  action:{kind:'dispatch'|'escalate'|'waiting',label,hint} }
```

**`PosInvoice`** (#8) — batches carry the "additional order" markers:
```ts
{ ref,tableRef,tableNumber,pax,waiter:{id,name},openedAtLabel,durationLabel,
  batches:{label:string|null, lines:{qty,name,station,rate,amount}[]}[],
  subtotalItems,subtotal,serviceChargePct,serviceCharge,discount?,discountLabel?,grandTotal }
```

**`OwnerDashboard`** (#9): `{greet,ownerName,lead, pnl:{netProfit,periodLabel,deltaLabel,
lines:{label,value,pct}[]}, miniStats[], revenueByHour:{hour,pct,peak?}[], peakNote, bestDishes[], bottomNote}`.

**`Wastage`** (#10): `{ref,reason,reasonLabel,note?,items:{name,code,qty,uom,rate,amount}[],
totalValue,managerLabel,reportedAtLabel,evidenceCount,status,tag?}`.

---

## 5. Wiring a write endpoint (mirror the feedback mutation)

```ts
// src/lib/api/wastage.ts
import { httpPost, USE_MOCKS } from './http';
import { ENDPOINTS } from './endpoints';
export function decideWastage(ref: string, body: { decision: string; note?: string }) {
  // add a Zod schema for the response and parse it
  return httpPost(ENDPOINTS.decideWastage(ref), body, WastageSchema);
}

// src/hooks/useWastage.ts
export function useDecideWastage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { ref: string; decision: string; note?: string }) =>
      decideWastage(v.ref, { decision: v.decision, note: v.note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wastage'] }),
  });
}
```
Then call `.mutate(...)` from the button and invalidate the affected query keys:
`['tables', …]`, `['kds', station]`, `['aggregate']`, `['invoice', ref]`, `['wastage', …]`.

---

## 6. Realtime

`src/lib/realtime/socket.ts` exposes the exact surface the real client must keep:
```ts
subscribe(channel: string, handler: (payload: unknown) => void): () => void;
```
Channels: `kds:drinks` · `kds:main` · `kds:bbq` · `kds:*`. Today it emits a fake
`{type:'kot.tick', station, ref, state, at}` every 8s; consumers just invalidate
and refetch. Replace this file with a real WebSocket/SSE client — keep the
signature and channel names. The backend only needs to emit on the right channel
when a KOT changes; the frontend re-pulls the authoritative board (§2 #6/#7).

---

## 7. Conventions & gotchas

- **Currency:** integer **PKR** (no paisa) except wastage `rate`/`amount` (2-decimal
  cost). Send raw numbers; the UI formats (`src/lib/format.ts`). A few owner
  fields (`miniStats.value`, delta strings) are intentionally pre-formatted text.
- **Time:** durations are **seconds** (`slaSeconds`, `elapsedSeconds`, …); some
  fields are pre-formatted labels (`openedAtLabel`). Switch to ISO + client
  formatting later if you prefer.
- **IDs are the sheet-refs:** `T-01`, `TAKE-041`, `KOT-D-1042`, `INV-C-2026-0231`,
  `WST-C-2026-0018` — used as route params and React keys.
- **Validation is mandatory:** keep every response going through its Zod schema;
  a shape drift fails at the boundary, not deep in a component.
- **Auth:** stub in `src/stores/session.ts`; add real headers in `http.ts`.

---

## 8. Run / build / deploy

```bash
pnpm install
pnpm dev         # http://localhost:5173  (mocks by default)
pnpm build       # typecheck + dist/  (per-route lazy chunks)
pnpm preview     # serve dist/
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
```
Deploy `dist/` as static files behind any web server / CDN. SPA fallback: route
all unknown paths to `index.html`. Set `VITE_API_BASE` / `VITE_USE_MOCKS` at
**build time** (Vite inlines them). CORS: allow the frontend origin on your API,
or serve both behind one host.

## 9. File map

```
src/
  routes/**             screens (A-01…C-01) + /dev/components gallery
  components/
    naqsha/  ui/  table/  kot/  bill/  layouts/
  lib/
    api/     endpoints.ts (paths) · http.ts (real) · client.ts (mock) · <feature>.ts
    mocks/   sample data (delete when live)
    realtime/socket.ts   stub → real socket
    format.ts            currency/time/duration
  hooks/                 one per data need (TanStack Query)
  stores/                cart.ts · session.ts (Zustand)
  types/                 domain.ts (truth) · api.ts (Zod)
  styles/                tokens.css · globals.css
tailwind.config.ts       design tokens (source of truth)
.env.example             VITE_API_BASE · VITE_USE_MOCKS
```
