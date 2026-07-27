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

# Naqsha — Screen ↔ API Map (with render snippets)

> One row per screen: **route → hook → endpoint → Frappe source → the shape it renders.**
> Everything already flows through a mock↔HTTP switch, so wiring a screen to Frappe means
> pointing one endpoint at a real path and making the response match the Zod schema — the
> component does not change. Read with `docs/FRONTEND_INTEGRATION_GUIDE.md` (how the switch
> works) and `docs/BACKEND_WORKFLOWS.md` (the state machines behind the calls).

Endpoints below are the keys in `src/lib/api/endpoints.ts`. Schemas live in
`src/types/*.ts` / `src/types/erp.api.ts`.

---

## 0 · The one render pattern every data screen uses

Every screen is the same three-state shape — learn it once:

```tsx
function InventoryScreen() {
  const { data, isLoading, isError, refetch } = useStockLevels(); // TanStack Query hook
  if (isError)   return <ErrorState label="stock" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;
  const rows = data ?? [];
  if (rows.length === 0) return <EmptyState message="No stock rows." />;
  return rows.map((r) => <StockRow key={r.itemCode} row={r} />);
}
```

- **`data`** is already parsed & typed by the row's Zod schema at the fetch boundary.
- Flip mock→live for the whole app with `VITE_USE_MOCKS=false` (see integration guide).
- Writes (submit/advance/pay) hit the write endpoints in the same registry.

---

## 1 · Auth

| Route | Purpose | Store / call | Frappe (prod) |
|---|---|---|---|
| `/login` | username + password (no role picker) | `useSessionStore.login` + `resolveDemoRole()` | `POST /api/method/login` → roles from `User` |

**Demo:** username `manager` / `owner` / `waiter` / `kitchen` (aliases `chef`,`kds`,`server`,`admin`),
any non-empty password. In prod the role comes from `frappe.get_roles()`, not the username.

```tsx
const role = resolveDemoRole(username);      // demo only
login(role, displayName);                    // → sets session.user
navigate(ROLE_HOME[role]);                   // waiter→/waiter/tables, etc.
```

---

## 2 · Front of house (waiter + manager floor, ordering)

| Route | Purpose | Hook | Endpoint | Frappe source | Renders |
|---|---|---|---|---|---|
| `/waiter/tables`, `/manager/floor` | floor plan + live table cards | `useOpenTables()` | `waiterTables` / `managerTables` | `Restaurant Table` (+ open `Sales Order`) | `TableCard[]` (state, pax, waiter, running total) |
| `/waiter/tables/:id` | tableside menu + cart → KOT | `useMenuCategories`,`useMenuItems` | `menuCategories`,`menuItems` | `Item` + `Item Price` | menu grid, modifiers, course/seat |
| `/manager/pos/:table` | bill preview, split, **multi-tender + FBR receipt** | `useInvoice(table)`, `useFiscalReceipt(ref)` | `invoice`, `fiscalReceipt` | `POS Invoice`, `naqsha.api.fiscal_receipt` | bill lines, split, MOP, FBR QR |

**Ordering write:** `submitOrder` → `POST /api/resource/Sales Order` (draft), server splits
lines into `KOT`s per `Item.restaurant_station` (workflows §1).

```tsx
// POS: bill + fiscal receipt (render only when the invoice ref is known)
const { data: inv } = useInvoice(tableId);
const { data: fiscal } = useFiscalReceipt(inv?.ref ?? ''); // guarded: no ref → no call
{inv.batches.map((b) => b.lines.map((l) => <BillLine line={l} />))}
{fiscal && <FbrReceipt invoice={fiscal} />}   // TAX-1/3 fiscal invoice + QR
```

---

## 3 · Kitchen (KDS) — live SLA timers

| Route | Purpose | Hook | Endpoint | Frappe source | Renders |
|---|---|---|---|---|---|
| `/kds/:station` | station board, **timers tick live** | `useKotStream(station)` | `kdsBoard(station)` | `naqsha.api.kds_board` | `KdsBoard {meta, queue, active, prepared}` |
| `/manager/kds` | cross-station aggregate | `useAggregate()` | `kdsAggregate` | `naqsha.api.kds_aggregate` | `AggregateRow[]` sorted by readiness |

The timer is **real**, not a stub: each KOT carries a `receivedAt` ISO timestamp and the UI
counts up from it every second (`useNow`), comparing to `slaSeconds`. In prod, map
`receivedAt` to the KOT's `started_at` / `creation`.

```tsx
// KotTimer.tsx — live elapsed from a real timestamp
const now = useNow();                                   // ticks every 1s
const elapsed = elapsedSecondsSince(kot.receivedAt, now);
const isBreach = elapsed - kot.slaSeconds > 0;          // flips styling live
```

**Advance state:** `advanceKot(ref)` → `POST /api/method/naqsha.api.advance_kot {kot, to}`.
**Realtime:** `subscribe('kds:main', …)` invalidates the query on `naqsha:kot_update`.

---

## 4 · Menu, inventory, purchasing

| Route | Hook | Endpoint | Frappe DocType |
|---|---|---|---|
| `/manager/menu` | `useMenuAdminItems`,`useCombos`,`useTimedMenus` | `menuAdminItems`,`combos`,`timedMenus` | `Item`, `Product Bundle`, `Pricing Rule` |
| `/manager/inventory` | `useStockLevels`,`useBoms`,`useCogsSummary` | `stockLevels`,`boms`,`cogsSummary` | `Bin`, `BOM`, Gross-Profit report |
| `/manager/purchasing` | `usePurchaseOrders`,`useSuppliers` | `purchaseOrders`,`suppliers` | `Purchase Order`, `Supplier` |

**Writes:** `saveMenuItem`, `toggle86`, `saveStockEntry`, `savePurchaseOrder`, `saveSupplier`.
86-ing an item = `PUT /api/resource/Item/{code} {is_86:1}` → `naqsha:menu_update`.

```tsx
// Menu admin — 86 toggle + price, straight off Item / Item Price
const { data: items } = useMenuAdminItems();
items.map((it) => (
  <ItemRow name={it.name} price={it.price} available={!it.is86}
           onToggle86={() => save86(it.code)} />
));
```

---

## 5 · CRM, loyalty, marketing

| Route | Hook | Endpoint | Frappe |
|---|---|---|---|
| `/manager/customers` | `useCustomers` | `customers` | `Customer` (+ `Loyalty Point Entry`) |
| `/manager/marketing` | `useCampaigns`,`useCoupons` | `campaigns`,`coupons` | `Email Campaign`, `Coupon Code` |

Loyalty balance = sum of `Loyalty Point Entry` for the customer; phone (`mobile_no`) is the
cross-channel key. Client mirror: `src/stores/loyalty.ts` (1 pt / ₨100).

---

## 6 · Reservations

| Route | Hook | Endpoint | Frappe |
|---|---|---|---|
| `/manager/reservations` | `useReservations`,`useWaitlist` | `reservations`,`waitlist` | `Table Reservation`, `Waitlist Entry` |

**Writes:** `saveReservation`, `saveWaitlist`. Seating a reservation flips
`Table Reservation.status=seated` + `Restaurant Table.state=occupied` (workflows §8).

---

## 7 · Owner (dashboards, reports, staff)

| Route | Hook | Endpoint | Frappe source |
|---|---|---|---|
| `/owner/dashboard` | `useOwnerDashboard(period)` | `ownerDashboard` | `naqsha.api.owner_dashboard` (composed) |
| `/owner/reports` | `usePnlReport`,`useItemPerformance`,`useBranchReport` | `pnlReport`,`itemPerformance`,`branchReport` | `query_report.run` (P&L, Sales Analytics) |
| `/owner/staff` | `useAttendance`,`useStaffPerformance`,`useShifts`,`usePayroll` | `attendance`,`staffPerformance`,`shifts`,`payroll` | `Attendance`,`Shift Assignment`,`Salary Slip` |
| `/owner/wastage`, `/manager/wastage` | `useWastage*` | `wastagePending`,`wastageCounts`,`wastageWeek` | `Wastage Entry` (Frappe **Workflow**) |

Owner dashboard is **one composed payload** (`OwnerDashboard`: P&L lines + miniStats +
revenueByHour + bestDishes) so the screen renders in a single fetch.

```tsx
const { data: d } = useOwnerDashboard('day');
<StatTile label="Net sales" value={money(d.miniStats.netSales)} />
<PnlTable lines={d.pnl} />
<RevenueByHour data={d.revenueByHour} />
```

Wastage is a real Frappe Workflow: manager `POST /api/resource/Wastage Entry`
(→ `Pending`), owner `apply_workflow {action:"Approve"|"Reject"}` → Approve creates a
`Stock Entry (Material Issue)` (workflows §2).

---

## 8 · In-restaurant customer surfaces (public, no auth)

| Route | Purpose | Hook | Frappe |
|---|---|---|---|
| `/order/:table` | dine-in QR order & pay | `useMenuCategories`,`useMenuItems`,`useLoyaltyStore` | `Sales Order` (`channel=cafe`) |
| `/kiosk` | self-order kiosk | same menu hooks | `Sales Order` |
| `/feedback/:table` | QR feedback | `useFeedback` / `submitFeedback` | `Customer Feedback` |

Phone is optional (loyalty only). **Web delivery/pickup, aggregator inbox, and delivery
dispatch were removed — they belong to the separate customer web app** (roadmap scope note).

---

## 9 · Ops

| Route | Purpose | Config / source |
|---|---|---|
| `/manager/cameras` | live Hikvision CCTV | `src/lib/cameras.ts` + `VITE_CAM*` env → `<video>`/`<img>` |

No mock feed — real stream URLs from the media gateway, honest per-tile status. See
`docs/CAMERA_HIKVISION_SETUP.md`.

---

## 10 · Write endpoints quick index (`endpoints.ts`)

`submitOrder`, `updateOrder`, `advanceKot`, `dispatchTable`, `payInvoice`, `submitWastage`,
`decideWastage`, `submitFeedback`, `saveMenuItem`, `toggle86`, `saveStockEntry`,
`savePurchaseOrder`, `saveSupplier`, `saveCustomer`, `saveCampaign`, `saveReservation`,
`saveWaitlist`, `clockInOut`. Wrap each with a `useMutation` calling `httpPost` (guide §4).
