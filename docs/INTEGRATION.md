> # ⚠️ SUPERSEDED — historical reference only
>
> Written before the backend existed. It is stale in three specific ways:
> it assumes **Frappe v15**, it calls the billing doctype **`POS Invoice`** (v1 uses
> `Sales Invoice` with `is_pos=1`, per D-02), and it uses the **`naqsha.api.*`** method
> prefix (the app is `naqsha_pos`, per D-03).
>
> Superseded by **`app_documentation/NAQSHA_API_CONTRACT.md`**. For what was actually built, read
> `app_documentation/IMPLEMENTATION_LOG.md`.
>
> Kept because it still records the frontend's original intent, which is useful context.

# Naqsha — Frontend ↔ Frappe Integration Guide

> **Goal: get you wiring the real Frappe backend fast.** This is the verbose "how it all
> connects" doc. It explains the data flow the app already has, the exact Frappe REST
> conventions you'll call, and a day-by-day path to go from mocks → live. Pair it with
> `docs/SCREEN_API_MAP.md` (which screen calls what) and `docs/BACKEND_WORKFLOWS.md` (the
> state machines).

---

## 1 · Architecture in one picture

```
React SPA (Vite, TS)                         Frappe / ERPNext site
─────────────────────                        ─────────────────────
components ─▶ TanStack Query hooks           /api/resource/{DocType}      (CRUD)
                 │                            /api/method/{dotted.path}    (custom + reports)
                 ▼                            /api/method/login            (auth)
   src/lib/api/*.ts  ── USE_MOCKS? ──┐        socket.io (frappe.realtime)  (live updates)
        │ true                       │ false
        ▼                            ▼
   src/lib/mocks/*.ts          src/lib/api/http.ts ──fetch──▶ VITE_API_BASE + path
        │                            │
        └──────── Zod schema.parse() at the boundary (both paths) ───────┘
```

Key idea: **the component never knows if it's talking to a mock or Frappe.** Both paths
return the same Zod-validated shape. You flip the source with one env var, or per-endpoint
as you migrate.

Files that matter:
- `src/lib/api/http.ts` — `USE_MOCKS`, `API_BASE`, `httpGet`, `httpPost`, `headers()`.
- `src/lib/api/endpoints.ts` — **every path in one registry**. Rename here, nowhere else.
- `src/lib/api/erp.ts`, `kitchen.ts`, `owner.ts`, … — typed getters that pick mock vs http.
- `src/hooks/*` — TanStack Query hooks the screens call.
- `src/types/*.ts`, `src/types/erp.api.ts` — Zod schemas = the contract.
- `src/lib/realtime/socket.ts` — `subscribe(channel, handler)` seam for live events.

---

## 2 · The mock↔live switch (how to flip it)

`http.ts`:
```ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false';
```

Every getter is written like this (see `erp.ts`):
```ts
function listGetter<T>(schema, mock, path) {
  const arr = z.array(schema);
  return () => (USE_MOCKS ? mockGet(arr, mock) : httpGet(path, arr));
}
```

- **Global:** set `VITE_USE_MOCKS=false` → the whole app calls Frappe.
- **Per-endpoint migration (recommended):** keep `VITE_USE_MOCKS=true` while you bring
  DocTypes online one at a time by hardcoding a single getter to `httpGet(...)`. Ship a
  screen, verify against real data, move to the next. Delete the mock when all consumers
  are live.

**The response must satisfy the Zod schema.** If Frappe returns extra/renamed fields, either
adjust the endpoint's `fields=[...]`, or add a thin adapter in the getter that maps the
Frappe row → the schema shape before `parse`. Do the mapping in `erp.ts`, never in a
component.

---

## 3 · Frappe REST conventions you will call

Frappe exposes two families (both under `VITE_API_BASE`, e.g. `https://erp.yourco.com`):

### 3a · Document REST — `/api/resource/{DocType}`
| Verb | Path | Does |
|---|---|---|
| GET | `/api/resource/Item?fields=["name","item_name","standard_rate"]&limit_page_length=0` | list (add `filters=[[...]]`) |
| GET | `/api/resource/Item/{name}` | one doc (full) |
| POST | `/api/resource/Item` | create (JSON body = fields, incl. child-table arrays) |
| PUT | `/api/resource/Item/{name}` | update fields |
| DELETE | `/api/resource/Item/{name}` | delete |

- **Filters:** `filters=[["actual_qty","<","reorder_level"]]` (URL-encode).
- **Pagination:** `limit_start`, `limit_page_length` (`0` = all — use sparingly).
- **Child tables** are nested arrays in the body, e.g. a `Sales Order` with `items: [...]`.
- **Submit/cancel** a submittable doc: `POST /api/resource/{DocType}/{name}?run_method=submit`
  (docstatus 0→1) or `...run_method=cancel` (→2). This is how POS Invoice / wastage get
  submitted.

### 3b · Methods & reports — `/api/method/{dotted.path}`
- Whitelisted server functions: `/api/method/naqsha.api.kds_board?station=drinks`.
- Standard workflow action: `/api/method/frappe.model.workflow.apply_workflow`
  `{doc: <json>, action: "Approve"}`.
- Query reports (owner P&L etc.): `POST /api/method/frappe.desk.query_report.run`
  `{report_name:"Profit and Loss Statement", filters:{...}}`.

### 3c · Which to use
- Simple CRUD on a DocType → **`/api/resource`** (already the default in `endpoints.ts`).
- Anything that composes/aggregates/does business logic (KDS board, owner dashboard,
  accept order, fiscal receipt) → a **whitelisted `naqsha.api.*` method** so the frontend
  gets exactly the shape it renders. Write these on the server:

```python
# naqsha/api.py  (in your custom Frappe app)
import frappe

@frappe.whitelist()
def kds_board(station: str):
    # ... assemble queue/active/prepared for this station ...
    return {"meta": meta, "queue": queue, "active": active, "prepared": prepared}
```

Keep the JSON keys identical to the Zod schema (`camelCase` in the schemas → either return
camelCase from Python, or map in the getter). Pick one convention and stick to it.

---

## 4 · Writes / mutations (submit, advance, pay)

Read endpoints are wired through the mock/http switch. Write endpoints are listed in
`endpoints.ts` but most have **no wrapper yet** — add them with `useMutation` + `httpPost`:

```ts
// src/hooks/useAdvanceKot.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpPost } from '@/lib/api/http';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { z } from 'zod';

export function useAdvanceKot(station: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { kot: string; to: 'preparing' | 'prepared' }) =>
      httpPost(ENDPOINTS.advanceKot(vars.kot), vars, z.object({ ok: z.boolean() })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kds', station] }),
  });
}
```

Rules of thumb:
- Validate the **response** with a Zod schema too (even a tiny `{ok:true}`).
- `invalidateQueries` the affected read key on success so the UI refetches.
- For optimistic UI (KDS "Mark prepared"), use `onMutate`/`onError` rollback.
- Idempotency for retried/offline writes: send an `offline_ref`; server dedupes (§7).

---

## 5 · Authentication & headers

Two supported modes — set them in `headers()` in `http.ts`:

**A. Session + CSRF (browser login).**
```ts
// login once:
await fetch(`${API_BASE}/api/method/login`, {
  method: 'POST', credentials: 'include',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({ usr: username, pwd: password }),
});
// then every request:
function headers() {
  return { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': window.csrf_token };
}
// and add credentials:'include' to fetch() calls.
```
The role comes from the logged-in `User`: `GET /api/method/frappe.auth.get_logged_user`
then `frappe.get_roles`. Replace `resolveDemoRole()` with that lookup; keep
`ROUTE_ROLES`/`navConfig` as the UI gate (the DocType permissions are the real boundary).

**B. API key + secret (kiosk / service).**
```ts
function headers() {
  return { 'Content-Type': 'application/json',
           Authorization: `token ${key}:${secret}` };
}
```
Never ship a broad key to a public kiosk — scope a dedicated role and restrict it.

**CORS in dev:** either enable CORS on the Frappe site, or (simpler) proxy through Vite so
the browser sees same-origin:
```ts
// vite.config.ts
server: { proxy: { '/api': 'http://localhost:8000', '/socket.io': { target:'http://localhost:8000', ws:true } } }
```
Then leave `VITE_API_BASE` empty and paths stay relative.

---

## 6 · Realtime (live KDS / floor / invoice)

Frappe ships **socket.io** (`frappe.realtime`). The app already centralises the seam:
`src/lib/realtime/socket.ts` exposes `subscribe(channel, handler)`, used by `useKotStream`
and the floor. To go live, back it with the socket client:

```ts
import { io } from 'socket.io-client';
const socket = io(`${API_BASE}`, { withCredentials: true });
export function subscribe(channel: string, handler: () => void) {
  socket.on(channel, handler);
  return () => socket.off(channel, handler);
}
```
Server side, emit on state changes:
```python
frappe.publish_realtime('naqsha:kot_update', {"station": station})
```
Channels used: `naqsha:kot_update`, `naqsha:table_update`, `naqsha:invoice_update`,
`naqsha:menu_update`. The handler just `invalidateQueries` — data re-reads through the same
getter.

---

## 7 · Offline outbox (POS resilience)

POS must survive a flaky connection. Pattern:
1. On submit, write the `POS Invoice` payload to an **outbox** (IndexedDB/localStorage) with
   a client-generated `offline_ref`.
2. Try `httpPost`; on failure keep it queued and show the offline indicator.
3. On reconnect, replay the queue in order.
4. Server accepts `offline_ref` (a custom Data field) and **dedupes** so a retry can't double
   -charge. The `OfflineIndicator` component already exists for the UI half.

---

## 8 · Start-building-fast plan

**Day 1 — plumbing.** Stand up the Frappe site + custom app `naqsha`. Set `VITE_API_BASE`
(or the Vite proxy). Implement `headers()` auth (§5). Confirm `GET /api/method/frappe.auth.get_logged_user`
returns you. Keep `VITE_USE_MOCKS=true`.

**Day 2 — auth for real.** Replace `resolveDemoRole()` with the roles lookup; verify each
role lands on its home and `RequireAuth` gates correctly. Mirror `ROUTE_ROLES` with Role
Permission Manager server-side.

**Day 3–4 — read the core loop.** Create the DocTypes for §1 (`Restaurant Table`, `Item`,
`Sales Order`, `KOT`, `POS Invoice`) per `BACKEND_DOCTYPE_REQUIREMENTS.md`. Write
`naqsha.api.kds_board` / `kds_aggregate` / `owner_dashboard`. Flip **those getters** to
`httpGet` and verify the floor, KDS (live timers), and dashboard against seeded data.

**Day 5 — writes.** Wrap `submitOrder`, `advanceKot`, `payInvoice` with `useMutation` (§4).
Add `frappe.publish_realtime` on KOT/table/invoice changes and back `socket.ts` (§6).

**Day 6 — the rest of the DocTypes.** Menu/inventory/purchasing/CRM/reservations/staff are
plain `/api/resource` CRUD — turn each getter live, one screen at a time, adjusting
`fields=[...]` to match the schema.

**Day 7 — compliance & resilience.** FBR fiscal receipt method (`naqsha.api.fiscal_receipt`)
feeding the POS receipt; wastage **Workflow**; offline outbox (§7). Then delete dead mocks.

**Cameras** are independent of Frappe — follow `docs/CAMERA_HIKVISION_SETUP.md` whenever
the hardware is ready.

---

## 9 · Conventions & gotchas

- **One source of truth for paths:** only edit `endpoints.ts`. Components import hooks, not
  URLs.
- **Schema is the contract:** if a live response won't `parse`, fix the `fields`/adapter in
  the getter — don't loosen the schema to `any`.
- **camelCase vs snake_case:** Frappe is snake_case; the schemas are camelCase. Decide per
  method whether Python returns camelCase or the getter maps it. Be consistent.
- **Money:** integer paisa/rupees as the app uses; don't send floats you haven't rounded.
- **Permissions:** the SPA guard is UX only. Enforce on the server with DocType perms +
  the wastage Workflow.
- **Don't reintroduce delivery/aggregator here** — that's the separate customer app.
