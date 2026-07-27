> # ⚠️ SUPERSEDED — historical reference only
>
> Written before the backend existed. It is stale in three specific ways:
> it assumes **Frappe v15**, it calls the billing doctype **`POS Invoice`** (v1 uses
> `Sales Invoice` with `is_pos=1`, per D-02), and it uses the **`naqsha.api.*`** method
> prefix (the app is `naqsha_pos`, per D-03).
>
> Superseded by **`app_documentation/PLAN_FRAPPE_BACKEND.md`**. For what was actually built, read
> `app_documentation/IMPLEMENTATION_LOG.md`.
>
> Kept because it still records the frontend's original intent, which is useful context.

# Naqsha — Backend Workflows (Frappe / ERPNext / HRMS)

> **Purpose.** The *behaviour* behind the data model in `BACKEND_DOCTYPE_REQUIREMENTS.md`:
> state machines, who-can-do-what, and the exact API calls the frontend makes at each step.
> Read the two docs together. All paths are Frappe REST (`/api/resource`, `/api/method`).

Legend: **[FE]** frontend action · **[BE]** backend/server logic · **[RT]** realtime event.

---

## 1 · Order → Kitchen → Bill → Payment (core loop)

The floor→kitchen→bill loop that A-01/A-02, K-01, M-02, M-03 drive.

```
Waiter opens table ──▶ builds order ──▶ submits ──▶ KOT(s) generated per station
                                                        │
                                   ┌────────────────────┴───────────────────┐
                                   ▼ (each station)                          │
   queued ──start──▶ preparing ──(> SLA)──▶ breach ──ready──▶ prepared       │
                                   └──────────ready───────────▶ prepared     │
                                                        │                     │
                            all stations prepared ──▶ table 'ready' ──dispatch (M-02)
                                                        │
                            served ──▶ table 'billing' ──▶ POS Invoice built
                                                        │
                            payment (multi-tender) ──submit──▶ FBR fiscal stamp ──▶ closed
```

**States** (`Restaurant Table.state`): `free → occupied/mine → active → (breach) → ready → billing → free`.
**States** (`KOT.state`): `queued → preparing → (breach) → prepared`.

| Step | Actor | Call |
|---|---|---|
| Open table / start order | Waiter [FE] | `POST /api/resource/Sales Order` (draft) with `restaurant_table`, `waiter`, `pax`, items[] |
| Generate KOTs | [BE] on submit | server splits order lines by `Item.restaurant_station` → one `KOT` per station, `state=queued`, `queued_at=now`, `sla_seconds` snapshot |
| KDS board reads | Kitchen [FE] | `GET /api/method/naqsha.api.kds_board?station=drinks` → `{meta, queue, active, prepared}` |
| Start cooking | Kitchen [FE] | `POST /api/method/naqsha.api.advance_kot {kot, to:"preparing"}` → sets `started_at` |
| SLA breach | [BE/RT] | scheduler (or read-time compare) flips `preparing→breach` when `now-started_at > sla_seconds`; emits `[RT] kot_update` |
| Mark prepared | Kitchen [FE] | `advance_kot {kot, to:"prepared"}` → `prepared_at`, `on_time = prepared_at-started_at ≤ sla` |
| Aggregate view | Manager [FE] | `GET /api/method/naqsha.api.kds_aggregate` → `AggregateRow[]` |
| Dispatch waiter | Manager [FE] | `POST /api/method/naqsha.api.dispatch_table {table}` (notifies waiter; `[RT] table_update`) |
| Build bill | Manager [FE] | `GET /api/resource/POS Invoice?filters=[["restaurant_table","=",t]]` (or create draft from the Sales Order) |
| Take payment | Manager [FE] | `PUT` invoice `payments[]` (B-1/B-2 modes) → `POST /api/method/…/POS Invoice/{name}?run_method=submit` |
| FBR stamp | [BE] on submit | FBR integration app fills `fbr_invoice_number`, `fbr_pos_id`, `fiscal_qr` → frontend renders (TAX-1/3) |

> **Note.** The standalone *Checkout* screen was removed as redundant — multi-tender
> payment, service charge / discount, and the **FBR fiscal receipt** (TAX-1/3) all live on
> the **POS screen** (`/manager/pos/:table`, M-03). "Build bill" and "Take payment" above
> are the same POS screen; there is no second checkout step.

**Realtime channels** (`frappe.publish_realtime`): `naqsha:kot_update` (station board),
`naqsha:table_update` (floor + aggregate), `naqsha:invoice_update`. The frontend's
`src/lib/realtime/socket.ts` `subscribe(channel, handler)` stub maps directly to these.

---

## 2 · Wastage capture → Owner approval (Frappe Workflow)

M-04 (manager submits) → O-02 (owner approves/rejects). This is a real **Frappe Workflow**
on **Wastage Entry**.

```
Draft ──submit(manager)──▶ Pending ──approve(owner)──▶ Approved ──▶ [BE] Stock Entry (Material Issue)
                              └────────reject(owner)──▶ Rejected
```

**Workflow definition:**

| State | Doc status | Allowed role | Action → next |
|---|---|---|---|
| Pending | 1 (submitted) | Restaurant Manager | (created here) |
| Approved | 1 | Restaurant Owner | **Approve** |
| Rejected | 1 | Restaurant Owner | **Reject** |

| Step | Actor | Call |
|---|---|---|
| File wastage | Manager [FE] | `POST /api/resource/Wastage Entry` (items[], reason, evidence) → `workflow_state=Pending` |
| Pending list | Owner [FE] | `GET /api/resource/Wastage Entry?filters=[["workflow_state","=","Pending"]]` |
| Approve/Reject | Owner [FE] | `POST /api/method/frappe.model.workflow.apply_workflow {doc, action:"Approve"|"Reject"}` |
| Stock impact | [BE] on Approve | create `Stock Entry` (Material Issue) for the wasted items; link back to `stock_entry` |
| Counts / summary | [FE] | `naqsha.api.wastage_counts`, `naqsha.api.wastage_summary?range=week` |

---

## 3 · Menu & availability (N-1 / N-2 / N-3 / N-4)

| Flow | Actor | Call |
|---|---|---|
| Create/edit item | Manager [FE] | `POST/PUT /api/resource/Item` (+ image, `restaurant_station`, `prep_time_seconds`) |
| Set price | [FE] | `POST /api/resource/Item Price` (item_code, price_list, price_list_rate) |
| 86 an item | [FE] | `PUT /api/resource/Item/{code} {is_86:1, out_of_stock_reason}` → `[RT] menu_update` |
| Build combo | [FE] | `POST /api/resource/Product Bundle` (new_item_code, items[]) |
| Time-based menu | [BE] | `Pricing Rule` with `valid_from`/`valid_upto` + time; frontend just reads effective price |

Availability may also be **stock-driven**: derive `is_86` from `Bin.actual_qty ≤ 0` for
stock-tracked items at read time.

---

## 4 · Inventory & procurement (I-1 / I-4 / I-5)

```
Low stock (Bin.actual_qty ≤ reorder_level) ──▶ Material Request ──▶ Purchase Order ──▶ receipt ──▶ stock up
Manual adjustment ──▶ Stock Entry (Material Issue/Receipt)
```

| Step | Actor | Call |
|---|---|---|
| Stock levels | Manager [FE] | `GET /api/resource/Bin?fields=["item_code","warehouse","actual_qty"]` |
| Low-stock flag | [FE] | compare `actual_qty` vs `Item.reorder_level` |
| Adjust stock | [FE] | `POST /api/resource/Stock Entry {stock_entry_type, items[]}` |
| Raise request | [FE] | `POST /api/resource/Material Request` |
| Create PO | [FE] | `POST /api/resource/Purchase Order` (supplier, items[], schedule_date) |
| Supplier CRUD | [FE] | `POST/PUT /api/resource/Supplier` |

---

## 5 · Payments detail (B-1 / B-2 / B-3 / B-4 / B-5)

- **Multi-tender (B-1/B-2):** `POS Invoice.payments[]` rows, one per `Mode of Payment`
  (Cash, Card, **JazzCash**, **Easypaisa**). `paid_amount` sum, `change_amount` computed
  by ERPNext. Wallet tenders may carry a reference/txn id field.
- **Service charge (B-4):** `Sales Taxes and Charges` row, `charge_type=Actual`,
  `description="Service Charge"`, amount = `service_charge_pct × subtotal`.
- **Discount (B-3):** `additional_discount_percentage`/`discount_amount`, or a
  `Pricing Rule`/`Coupon Code`. **Refund/void:** Sales Return (`is_return=1`, Credit Note)
  or cancel the submitted `POS Invoice` (docstatus→2) — role-gated to Manager/Owner.
- **Offline (B-5):** frontend queues `POS Invoice` payloads in an outbox
  (IndexedDB/localStorage) and replays `POST` on reconnect; server must accept an
  idempotency key (`offline_ref`) to dedupe. Backend adds an `offline_ref` Data field.

---

## 6 · Customer, loyalty, marketing (G-1..G-4)

| Flow | Call |
|---|---|
| Customer profile + history | `GET /api/resource/Customer/{name}` + `GET /api/resource/Sales Invoice?filters=[["customer","=",c]]` |
| Loyalty balance | `GET /api/resource/Loyalty Point Entry?filters=[["customer","=",c]]` (sum points) |
| Accrue points | [BE] automatic on `Sales Invoice` submit when `Loyalty Program` set |
| Redeem at POS | [FE] set `redeem_loyalty_points=1`, `loyalty_points` on the invoice |
| Coupon | [FE] apply `Coupon Code` → linked `Pricing Rule` discount |
| Campaign | [FE] `POST /api/resource/Email Campaign` / trigger `Notification`; WhatsApp via integration method |

---

## 7 · Online ordering, aggregators, delivery — MOVED to a separate app

> **Out of scope for this repo.** Own online storefront (delivery + pickup), the
> aggregator (foodpanda/Careem) inbox, and delivery/rider dispatch were removed from
> this staff/console app and will ship as a **separate customer web app**. The
> `Storefront`, `Manager · Online`, `Manager · Checkout`, `Delivery Trip`, and
> `Aggregator Order` surfaces no longer exist here.
>
> What remains in **this** app is **in-restaurant** ordering only:
> - **Dine-in QR order & pay** (`/order/:table`) and **self-order kiosk** (`/kiosk`) —
>   both write a `Sales Order` and route to the kitchen exactly as in §1.
>
> When the separate app lands, its own web orders (and any accepted aggregator orders)
> should create `Sales Order`s against the same site so they flow into the same KOT /
> KDS pipeline (§1). Keep the `channel` custom field (`cafe | web | aggregator`) on
> `Sales Order` so kitchen and reports can tell them apart.

---

## 8 · Reservations & waitlist (RES-1 / RES-2)

```
Reservation: booked ──seat──▶ seated ; ──cancel──▶ cancelled ; ──no-show──▶ no_show
Waitlist:    waiting ──seat──▶ seated ; ──leave──▶ left
```

| Step | Call |
|---|---|
| Book | `POST /api/resource/Table Reservation` (reserved_at, party_size, restaurant_table) |
| Day view | `GET /api/resource/Table Reservation?filters=[["reserved_at","between",[d0,d1]]]` |
| Seat → occupy table | `PUT` reservation `status=seated` + `PUT Restaurant Table state=occupied` |
| Waitlist add / seat | `POST/PUT /api/resource/Waitlist Entry` |

---

## 9 · Staff / HR / Payroll (S-2 / S-3 / S-4 / S-5)

**Attendance (S-2):**
```
Employee Checkin (IN) ──▶ … ──▶ Employee Checkin (OUT) ──[BE nightly]──▶ Attendance (Present/…)
```
| Step | Call |
|---|---|
| Clock in/out | `POST /api/resource/Employee Checkin {employee, log_type:"IN"|"OUT", time}` |
| Today's status | `GET /api/resource/Attendance?filters=[["attendance_date","=",today]]` |

**Sales-by-waiter (S-3):** waiter set as `Sales Person` in the invoice `sales_team`;
leaderboard from `GET /api/method/frappe.desk.query_report.run?report_name=Sales Person-wise Transaction Summary`.

**Shift scheduling (S-4):**
| Step | Call |
|---|---|
| Roster | `GET /api/resource/Shift Assignment?filters=[["start_date","between",…]]` |
| Assign | `POST /api/resource/Shift Assignment {employee, shift_type, start_date, end_date}` |

**Payroll (S-5, read-only display):**
```
Salary Structure Assignment ──▶ Payroll Entry (period) ──▶ Salary Slip (per employee)
```
| Step | Call |
|---|---|
| Payroll summary | `GET /api/resource/Salary Slip?filters=[["start_date","=",p]]&fields=["employee","gross_pay","net_pay"]` |
| Run detail | `GET /api/resource/Payroll Entry/{name}` |

> Frontend is **display-only** for payroll — runs/approvals happen in the ERPNext desk.

---

## 10 · Reporting (O-3 / O-4 / O-5 / I-3)

All via `POST /api/method/frappe.desk.query_report.run` with `report_name` + `filters`:

| Screen | report_name |
|---|---|
| O-3 P&L | `Profit and Loss Statement` |
| O-3/O-4 Sales trends & item mix | `Sales Analytics` / `Item-wise Sales Register` |
| I-3 Food-cost % / COGS | `Gross Profit` / `Stock Ledger` |
| O-5 Multi-branch | `Consolidated Financial Statement` (company dimension) |

Owner dashboard (O-01) stays a single composed method `naqsha.api.owner_dashboard(period)`
returning the `OwnerDashboard` shape (P&L lines + miniStats + revenueByHour + bestDishes),
so the frontend renders one payload.

---

## 11 · Permissions summary (Naqsha roles)

| Role | Can |
|---|---|
| **Restaurant Waiter** | read menu/tables; create Sales Order/KOT; read own invoices |
| **Restaurant Kitchen** | read KOTs for station; advance KOT state |
| **Restaurant Manager** | all above + POS Invoice submit, discounts, wastage submit, menu/stock/PO, reservations |
| **Restaurant Owner** | read dashboards/reports; approve/reject wastage; payroll read |
| **Naqsha API** (service acct) | the union needed by the kiosk token; scope-restrict per deployment |

Map these to Frappe **Role** + **Role Permission Manager**; wastage transitions are enforced
by the **Workflow** (owner-only Approve/Reject), not just DocType perms.

---

## 12 · Auth & role routing (v1 refactor)

```
Login (role + credentials) ──▶ token/session ──▶ SPA gates routes by role ──▶ role home
```
| Step | Actor | Call |
|---|---|---|
| Sign in | Staff [FE] | `POST /api/method/login` or attach `Authorization: token key:secret` |
| Resolve identity | [BE] | return `User` + roles + linked `Employee`; SPA stores role |
| Guard route | [FE] | `RequireAuth` checks role vs `ROUTE_ROLES`; deny → redirect to role home |
| Sign out | [FE] | clear token/session; back to `/login` |

Frontend gating must **mirror** server Role Permissions — the SPA guard is UX, the DocType
perms are the real boundary. Roles: Restaurant Waiter / Kitchen / Manager / Owner.

## 13 · Loyalty accrual & redemption

```
Order placed (cafe QR / web) ──▶ Customer resolved by phone/email
     ──▶ [BE] Loyalty Point Entry (earn = amount × conversion)  ──▶ running balance
Redeem (POS / web, v1.1) ──▶ redeem_loyalty_points on invoice ──▶ negative Loyalty Point Entry
```
| Step | Actor | Call |
|---|---|---|
| Resolve customer | [BE] | find `Customer` by `mobile_no`/`email_id`; create if opted-in (guest = skip) |
| Earn (v1) | [BE] on Sales Invoice/Order submit | `Loyalty Point Entry` when `Loyalty Program` set — same identity across cafe + web |
| Show balance | [FE] | `GET /api/resource/Loyalty Point Entry?filters=[["customer","=",c]]` (sum) |
| Redeem (v1.1) | [FE] | set `redeem_loyalty_points=1`, `loyalty_points` on invoice |

**Earn rule:** 1 point per ₨100 (matches `src/stores/loyalty.ts`; production uses the
`Loyalty Program` conversion factor). Phone is the primary cross-channel key.

## 14 · In-restaurant QR / kiosk order → pay (dine-in)

> Web delivery/pickup checkout moved to the separate customer app (§7). What stays here
> is the **dine-in** flow: a guest scans the table QR (`/order/:table`) or uses the
> **kiosk** (`/kiosk`), orders, and pays at the table.

```
Cart ──▶ (optional phone for rewards) ──▶ Sales Order(channel='cafe', restaurant_table) ──▶ KOT(s) [§1]
     ──▶ pay at table (POS Invoice, §1/§5) ──▶ loyalty earn by phone (§13)
```
| Step | Actor | Call |
|---|---|---|
| Place order | Guest [FE] | `POST /api/resource/Sales Order` (`channel=cafe`, `restaurant_table`, items[]) |
| Resolve rewards | [BE] | if phone given, upsert `Customer` by `mobile_no` and accrue points (§13); else guest |
| Route to kitchen | [BE] | generate `KOT`(s) as in §1 |
| Settle | Manager [FE] | POS Invoice + payments[] (§1 "Take payment", §5) |

Phone is **optional** for a dine-in guest — it only drives loyalty accrual; the order
itself needs no customer identity.
