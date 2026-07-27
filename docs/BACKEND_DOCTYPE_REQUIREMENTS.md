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

# Naqsha — Backend DocType Requirements (Frappe / ERPNext / HRMS)

> **Purpose.** The data model the backend must expose so the Naqsha frontend can
> fetch and display data (and post transactions). Derived from the frontend feature
> surface in `based-on-feature-comparison` plan + the ground-truth types in
> `src/types/domain.ts`. Companion: **`BACKEND_WORKFLOWS.md`** (behaviour/state machines).
>
> **The frontend owns no data model** — it reads/writes ERPNext over REST. This doc
> tells the backend team **which standard DocTypes to enable** and **which custom
> DocTypes / custom fields to create**. Field lists are the frontend's *minimum needs*;
> add more freely.

---

## 0 · Conventions

- **App target:** Frappe v15 + ERPNext v15 + Frappe HR (HRMS) on one site.
- **Custom app:** put all custom DocTypes + fields in one app, e.g. `naqsha` (so they
  are migratable and not lost on update). Module: **Naqsha Restaurant**.
- **REST the frontend uses:**
  - `GET /api/resource/{DocType}?filters=[...]&fields=[...]&order_by=&limit_page_length=`
  - `GET /api/resource/{DocType}/{name}` · `POST /api/resource/{DocType}` · `PUT /api/resource/{DocType}/{name}`
  - `GET|POST /api/method/{dotted.path}` for actions, Query Reports, dashboards, aggregates.
- **Auth:** service-account **API key + secret** → `Authorization: token {key}:{secret}`.
  Give that user a **Naqsha API** role with the permissions below.
- **Field-type legend:** `Data`, `Select`, `Link→X`, `Int`, `Float`, `Currency`,
  `Check`(0/1), `Datetime`, `Small/Long Text`, `Table→X`(child), `Attach`, `JSON`.
- **Currency:** PKR throughout. **Branch:** modeled as ERPNext **Company** (or Branch +
  Cost Center + Warehouse) — see `O-05`/multi-branch.

---

## 1 · Standard DocTypes to reuse (enable + expose, no schema change)

| Feature | DocType(s) | Key fields the frontend reads / writes | Access |
|---|---|---|---|
| N-1 Menu admin | `Item`, `Item Group`, `Item Price`, `Price List` | item_code, item_name, description, image, item_group, standard_rate; Item Price: price_list_rate, price_list | R/W |
| FOH-2 Modifiers | `Item Variant`, `Item Attribute`, `Product Bundle` | attributes[], variant_of; bundle items | R |
| KDS-1 Recipe card | `BOM` | items[] (item_code, qty, uom), operations[] | R |
| FOH-1/R-4 Ordering (dine-in QR + kiosk) | `Sales Order`, `Sales Order Item` | customer, transaction_date, items[], total | R/W |
| B-1/B-2 Payments/POS | `POS Invoice`, `POS Profile`, `Mode of Payment` | payments[] (mode_of_payment, amount), paid_amount, change_amount, grand_total | R/W |
| B-3 Discounts/refunds | `Pricing Rule`, `Coupon Code`; Sales Return (Credit Note) | discount_percentage, discount_amount; is_return | R/W |
| B-4 Tips/service charge | `Sales Taxes and Charges` (Actual row on invoice) | charge_type=Actual, description, tax_amount | R/W |
| TAX-2 Provincial tax | `Sales Taxes and Charges Template` (per province) | taxes[] rate/description | R |
| I-1 Inventory | `Item`, `Bin`, `Warehouse`, `Stock Entry` | Bin: actual_qty, warehouse; Item: reorder_level; Stock Entry: purpose, items[] | R/W |
| I-2 BOM costing | `BOM` | items[] with rate, total_cost | R |
| I-3 COGS / food-cost % | Query Report **Gross Profit** / **Stock Ledger** | via `/api/method/frappe.desk.query_report.run` | R |
| I-4 Procurement | `Material Request`, `Purchase Order`, `Purchase Order Item` | supplier, items[], schedule_date, status | R/W |
| I-5 Suppliers | `Supplier`, `Address`, `Contact` | supplier_name, supplier_group, contact/address | R/W |
| N-3 Combos | `Product Bundle` | new_item_code, items[] | R/W |
| N-4 Time-based menu | `Price List`, `Pricing Rule` (valid_from/valid_upto) | validity + price | R |
| G-1 CRM | `Customer`, `Contact`, `Address` | customer_name, mobile_no, customer_group; history via `Sales Invoice` list filtered by customer | R/W |
| G-2 Loyalty | `Loyalty Program`, `Loyalty Point Entry` | loyalty_points, expiry, conversion_factor | R/W |
| G-3 Marketing | `Email Campaign`, `Notification`, `SMS Settings` (+ WhatsApp integration) | recipients, message, schedule | R/W |
| G-4 Coupons | `Pricing Rule`, `Coupon Code` | coupon_code, pricing_rule, used | R/W |
| ~~R-2/R-3 Online & Delivery~~ | *moved to separate customer web app* | `Aggregator Order`, `Delivery Trip`, `Driver` live there | — |
| O-3 Sales/P&L | Query Reports **Profit and Loss Statement**, **Sales Analytics** | `/api/method/frappe.desk.query_report.run` | R |
| O-4 Item performance | Report **Item-wise Sales**/**Sales Analytics** | period, item, qty, amount | R |
| O-5 Multi-branch | `Company`, `Cost Center`, `Warehouse`; Consolidated Financial Statement | company dimension | R |
| S-2 Attendance | `Employee Checkin`, `Attendance` | employee, time, log_type; attendance_date, status | R/W |
| S-3 Sales-by-waiter | `Sales Person`, `Employee`; Sales-Person-wise report | sales_team on invoice; report rows | R |
| S-4 Shift scheduling | `Shift Type`, `Shift Assignment`, `Shift Request` | start_time/end_time, employee, date range | R/W |
| S-5 Payroll | `Salary Slip`, `Payroll Entry`, `Salary Structure` | employee, gross_pay, net_pay, posting_date | R |

> **Roles for the Naqsha API user:** Item/Stock/Buying = *Stock/Purchase User*; Selling/POS
> = *Sales User* + POS access; HR/Payroll = *HR User*/*Payroll User* (read for S-5). Restrict
> write scope per screen role at the app layer where needed.

---

## 2 · Custom DocTypes to create

Restaurant concepts with no ERPNext equivalent. Fields map 1:1 to `src/types/domain.ts`.

### 2.1 · Restaurant Table  _(maps `Table`)_
Powers A-01 waiter floor & M-01 manager floor.

| Field | Type | Notes |
|---|---|---|
| `table_number` | Data | "01"; **naming**: `T-{table_number}` (autoname) |
| `branch` | Link→Company | which outlet |
| `seats` | Int | capacity |
| `state` | Select | `free\|mine\|occupied\|active\|breach\|ready\|feedback\|billing` — runtime; may be **computed** server-side, see workflows |
| `current_waiter` | Link→Employee | assigned waiter (Sales Person too) |
| `active_pax` | Int | current cover count |
| `running_amount` | Currency | live bill total |
| `opened_at` | Datetime | session start |
| `active_order` | Link→Sales Order | current open order |

> `meta`, `actionTag`, `statusTag`, `kots[]` pips in the type are **display-derived** —
> the frontend computes them from state + related KOTs; backend need not store them.

### 2.2 · KDS Station  _(maps `StationMeta`)_
Config for each kitchen display.

| Field | Type | Notes |
|---|---|---|
| `station_id` | Data | "DRINKS" (**autoname**) |
| `station_name` | Data | "Drinks & coffee" |
| `station_key` | Select | `drinks\|main\|bbq` (routing key used on Item + KOT) |
| `sla_seconds` | Int | target prep time |
| `active_max` | Int | WIP limit |
| `branch` | Link→Company | — |

> `avgPrepLabel`, `slaCompliancePct`, `totalPrepared` are **computed** metrics → expose via
> a `/api/method` (see Workflows §KDS metrics), not stored fields.

### 2.3 · KOT + KOT Item  _(maps `Kot` / `KotItem`)_
The kitchen order ticket. Core of K-01 / M-02 and the SLA differentiator.

**KOT** (naming `KOT-{station_key}-{#####}`):

| Field | Type | Notes |
|---|---|---|
| `station` | Link→KDS Station | routing |
| `restaurant_table` | Link→Restaurant Table | or takeaway ref |
| `order_ref` | Link→Sales Order | source order |
| `state` | Select | `queued\|preparing\|breach\|prepared` |
| `sla_seconds` | Int | snapshot of station SLA at creation |
| `queued_at` | Datetime | enters queue |
| `started_at` | Datetime | → preparing |
| `prepared_at` | Datetime | → prepared |
| `on_time` | Check | prepared within SLA |
| `items` | Table→KOT Item | — |

> `waitSeconds` / `elapsedSeconds` / `doneSeconds` are **derived** from the timestamps
> at read time (or in the list `/api/method`); `breach` state is set when
> `now - started_at > sla_seconds` (a scheduler/realtime concern — see Workflows).

**KOT Item** (child):

| Field | Type | Notes |
|---|---|---|
| `item` | Link→Item | menu item |
| `item_name` | Data | denormalized for display |
| `qty` | Int | — |
| `comment` | Data | "no ice" |
| `course` | Select | FOH-3: `starter\|main\|dessert` (optional) |
| `seat` | Int | FOH-3 seat-level (optional) |

### 2.4 · Wastage Entry + Wastage Item  _(maps `Wastage` / `WastageItem`)_
M-04 capture + O-02 owner approval — a Naqsha differentiator. **Has a Frappe Workflow**
(see Workflows §Wastage).

**Wastage Entry** (naming `WST-{branch}-{YYYY}-{#####}`):

| Field | Type | Notes |
|---|---|---|
| `reason` | Select | `spillage\|refused\|cook_error\|expired\|other` |
| `note` | Small Text | context |
| `reported_by` | Link→Employee | manager who filed |
| `branch` | Link→Company | — |
| `reported_at` | Datetime | — |
| `total_value` | Currency | sum of item amounts (computed) |
| `evidence` | Attach (multiple) | photos → `evidenceCount` |
| `workflow_state` | Select | `Pending\|Approved\|Rejected` (Workflow field) |
| `stock_entry` | Link→Stock Entry | created on approval (Material Issue) |
| `items` | Table→Wastage Item | — |

**Wastage Item** (child):

| Field | Type | Notes |
|---|---|---|
| `item` | Link→Item | — |
| `item_code` | Data | "FIN-CHK-HDI" |
| `qty` | Float | — |
| `uom` | Link→UOM | plate/pc/kg |
| `rate` | Currency | avg cost |
| `amount` | Currency | qty × rate |

### 2.5 · Customer Feedback  _(maps `FeedbackContext` / `FeedbackSubmission`)_
C-01 QR feedback portal (already built; needs a backend home).

| Field | Type | Notes |
|---|---|---|
| `table_slug` | Data | public QR slug (**autoname**/unique) |
| `restaurant_table` | Link→Restaurant Table | — |
| `invoice_ref` | Link→POS Invoice | the bill being rated |
| `branch` | Link→Company | for `branchLabel` |
| `rating` | Int | 1..5 |
| `liked_dishes` | Small Text/JSON | selected dish chips |
| `comment` | Small Text | optional |
| `phone` | Data | optional, opt-in |
| `submitted_at` | Datetime | — |

> `dishOptions` (context) = dishes on the linked invoice; derive at read time. Feedback
> **write** must be allowed for the public/guest — expose via a whitelisted `allow_guest`
> method, not raw `/api/resource` (see Workflows §Feedback).

### 2.6 · Table Reservation  _(RES-1)_

| Field | Type | Notes |
|---|---|---|
| `customer` | Link→Customer | or walk-in name |
| `guest_name` | Data | when no Customer |
| `phone` | Data | — |
| `restaurant_table` | Link→Restaurant Table | assigned table |
| `reserved_at` | Datetime | booking slot |
| `party_size` | Int | — |
| `status` | Select | `booked\|seated\|cancelled\|no_show` |
| `branch` | Link→Company | — |

### 2.7 · Waitlist Entry  _(RES-2)_

| Field | Type | Notes |
|---|---|---|
| `guest_name` | Data | — |
| `phone` | Data | — |
| `party_size` | Int | — |
| `quoted_wait_min` | Int | — |
| `status` | Select | `waiting\|seated\|left` |
| `joined_at` | Datetime | — |
| `branch` | Link→Company | — |

### 2.8 · Aggregator Order  _(R-2)_
Inbox for foodpanda/other-platform tickets before they become a Sales Order/KOT.

| Field | Type | Notes |
|---|---|---|
| `platform` | Select | `foodpanda\|other` |
| `external_ref` | Data | platform's order id |
| `raw_payload` | JSON | original webhook body |
| `customer_name` | Data | — |
| `items_summary` | Small Text | for the inbox card |
| `status` | Select | `new\|accepted\|rejected\|routed` |
| `sales_order` | Link→Sales Order | created on accept |
| `received_at` | Datetime | — |
| `branch` | Link→Company | — |

---

## 3 · Custom fields on standard DocTypes

Add via Customize Form / fixtures in the `naqsha` app.

### On **Item** (menu behaviour)
| Field | Type | Feature |
|---|---|---|
| `restaurant_station` | Select `drinks\|main\|bbq` | KDS routing (KotItem.station) |
| `prep_time_seconds` | Int | KDS SLA per item |
| `is_86` | Check | N-2 out-of-stock/86 toggle |
| `out_of_stock_reason` | Data | N-2 (`outOfStockReason`) |
| `default_course` | Select | FOH-3 |

> **Menu category = `Item Group`** (`MenuCategory.name/count/station`); `count` derives from
> Item Group's item count; add `restaurant_station` on Item Group too if categories route.

### On **Sales Order** / **POS Invoice** / **Sales Invoice**
| Field | Type | Feature |
|---|---|---|
| `restaurant_table` | Link→Restaurant Table | ties order/bill to a table (PosInvoice.tableRef/number) |
| `waiter` | Link→Employee / Sales Person on `sales_team` | S-3 sales-by-waiter, `PosInvoice.waiter` |
| `pax` | Int | cover count |
| `fbr_invoice_number` | Data | TAX-1 (set by FBR integration) |
| `fbr_pos_id` | Data | TAX-1 |
| `fiscal_qr` | Small Text/Attach | TAX-3 (QR payload/image) |
| `service_charge_pct` | Percent | B-4 (`serviceChargePct`) |

> Province tax (TAX-2) needs **no custom field** — use a `Sales Taxes and Charges Template`
> per province and stamp the province on `Customer`/`Company` address.

---

## 4 · Reads that are computed, not stored (expose via `/api/method`)

These frontend shapes are **aggregates/derived** — provide whitelisted methods returning
the exact JSON, rather than a DocType:

| Frontend need | Suggested method | Returns |
|---|---|---|
| KDS board (K-01) | `naqsha.api.kds_board(station)` | `{meta, queue[], active[], prepared[]}` (`KdsBoard`) |
| Manager KDS aggregate (M-02) | `naqsha.api.kds_aggregate()` | `AggregateRow[]` (per-table station readiness) |
| Station metrics | inside `kds_board.meta` | avgPrep, slaCompliancePct, totalPrepared |
| Owner dashboard (O-01) | `naqsha.api.owner_dashboard(period)` | `OwnerDashboard` (P&L + miniStats + revenueByHour + bestDishes) |
| Wastage week summary | `naqsha.api.wastage_summary(range)` | totals for O-02 header |
| Approval counts | `naqsha.api.wastage_counts()` | `{pending, approved, rejected}` |
| Reports (O-3/O-4/I-3) | `frappe.desk.query_report.run` | native Query Report rows |

> These mirror the current `ENDPOINTS` registry (`src/lib/api/endpoints.ts`) — keep the
> paths, point them at `/api/method/...`. Read endpoints already flip mock↔http.

---

## 5 · Endpoint ↔ DocType crosswalk (current registry)

| `ENDPOINTS` key | Frappe target |
|---|---|
| `waiterTables` / `managerTables` | `GET /api/resource/Restaurant Table?filters=[["branch","=",b]]` (+ derived state) |
| `menuCategories` | `GET /api/resource/Item Group` |
| `menuItems` | `GET /api/resource/Item?filters=[["is_sales_item","=",1]]&fields=[…,restaurant_station,is_86]` |
| `kdsBoard(station)` | `GET /api/method/naqsha.api.kds_board?station=` |
| `kdsAggregate` | `GET /api/method/naqsha.api.kds_aggregate` |
| `invoice(tableRef)` | `GET /api/resource/POS Invoice?filters=[["restaurant_table","=",t],["docstatus","<",2]]` |
| `ownerDashboard(period)` | `GET /api/method/naqsha.api.owner_dashboard?period=` |
| `wastagePending` | `GET /api/resource/Wastage Entry?filters=[["workflow_state","=","Pending"]]` |
| `feedbackContext(slug)` | `GET /api/method/naqsha.api.feedback_context?t=` (allow_guest) |
| `submitFeedback` | `POST /api/method/naqsha.api.submit_feedback` (allow_guest) |
| `submitOrder` | `POST /api/resource/Sales Order` |
| `advanceKot(ref)` | `POST /api/method/naqsha.api.advance_kot` |
| `dispatchTable(ref)` | `POST /api/method/naqsha.api.dispatch_table` |
| `payInvoice(ref)` | submit `POS Invoice` (`POST /api/method/…submit`) |
| `submitWastage` | `POST /api/resource/Wastage Entry` |
| `decideWastage(ref)` | apply Workflow action (`POST /api/method/frappe.model.workflow.apply_workflow`) |

---

## 6 · Open questions for the backend team

1. **Table state** — store on `Restaurant Table` and mutate on events, or compute purely
   from open orders/KOTs at read time? (Frontend accepts either; computed is simpler.)
2. **FBR/PRA integration** — which app populates `fbr_invoice_number`/`fiscal_qr`? Frontend
   is display-only for these.
3. **Realtime** — Frappe socketio (`frappe.publish_realtime`) for KOT transitions, so the
   frontend's `subscribe(channel)` stub becomes a real socket. Channels in Workflows doc.
4. **Branch model** — one Company per outlet vs Company+Branch+Cost Center. Affects O-05.

---

## 7 · Additions from the v1 refactor (auth, loyalty, web-order identity)

Added while building role navigation, staff auth, customer registration on the web
storefront, and the loyalty loop. See `docs/FEATURE_ROADMAP.md` for versioning.

### 7.1 · Authentication & roles
The staff SPA now has a **login + role-gated routes**. Backend needs:

| Concern | Frappe | Notes |
|---|---|---|
| Login | `POST /api/method/login` (session) **or** API key+secret token | SPA sends `Authorization: token key:secret`; interactive login can use `frappe.auth` |
| Roles | **Role** DocType | Create **Restaurant Waiter / Kitchen / Manager / Owner** |
| Route access | Role Permission Manager | Frontend gate mirrors backend perms; both must agree (see `navConfig.tsx` `ROUTE_ROLES`) |
| Identity for header | `User` + linked `Employee` | `full_name`, default role → the SPA's `session` store |

Frontend route→role map to mirror server-side: waiter→(waiter,manager); kds→(kitchen,manager);
manager→manager; owner→owner; `/manager/reservations` also allowed for waiter (host seating).

### 7.2 · Loyalty (v1 earn, v1.1 redeem)
| Field / DocType | Type | Notes |
|---|---|---|
| `Customer.mobile_no` | Data | **UNIQUE** — the primary loyalty key (PK phone-first) |
| `Customer.email_id` | Data | secondary unique key |
| `Loyalty Program` | standard | conversion (1 pt / ₨100), expiry, tiers (v2) |
| `Loyalty Point Entry` | standard | one per earning/redeeming transaction, links `Customer` + invoice |
| `Sales Invoice.loyalty_points` / `redeem_loyalty_points` | standard | redemption at POS/web (v1.1) |

Uniqueness on `mobile_no`/`email_id` is what lets the same customer earn across **cafe (QR)**
and **web** channels under one identity (frontend `src/stores/loyalty.ts` mirrors this).

### 7.3 · Order channel & customer identity (in-restaurant)
Web delivery/pickup checkout **moved to the separate customer app**. In *this* app the only
order sources are **dine-in QR** (`/order/:table`) and the **kiosk** (`/kiosk`).

**Custom field to keep on `Sales Order`:**
| Field | Type | Feature |
|---|---|---|
| `channel` | Select `cafe\|web\|aggregator` | source of the order — keep it so the same site can receive orders from the separate web app later and reports/kitchen can distinguish them |
| `restaurant_table` | Link→Restaurant Table | dine-in QR / kiosk table |
| `contact_phone` | Data | optional dine-in loyalty key |

**Customer upsert (dine-in):** only when a phone is given for rewards — find `Customer` by
`mobile_no`, create if new, accrue points. A dine-in order needs **no** customer identity
otherwise. (`fulfillment_type`, `delivery_address`, and the COD/rider tender set belong to
the separate web app's `Sales Order`s, not here.)
