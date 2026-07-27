# Naqsha — Restaurant Management Feature Comparison

> **Purpose.** A competitive feature-reference guide: what Naqsha ships today versus the
> full feature surface of leading restaurant-management software in **Pakistan** and
> **internationally**. This is a **north-star backlog** for making Naqsha a professional,
> over-arching product — it does **not** change the **August deployment scope**.
>
> _Last compiled: 2026-07-22. Method & sources at the bottom._

---

## How to read this

Each feature row carries:

| Column | Meaning |
|---|---|
| **Naqsha** | `✅` have · `🟡` partial / stub · `❌` missing · `➖` n/a |
| **Instances** | How many of the **12** benchmarked competitors offer it, split **PK / Intl** (each out of 6) |
| **Priority** | Blended = market-prevalence **weighted by fit for a Pakistani cafe/restaurant**. `🔴` Critical · `🟠` High · `🟡` Medium · `⚪` Low |

**Benchmark set (12).** _Pakistan (6):_ Oscar POS · Bill Berry POS · Foodics (MENA/PK) · CORN POS · Foodnerd POS · CISePOS. _International (6):_ Toast · Square for Restaurants · Lightspeed Restaurant · TouchBistro · Petpooja (India) · Revel Systems.

> Instance counts are **research-based estimates** verified against each vendor's own
> material (see Sources). A feature is counted when there is clear or strong evidence of
> support; provincial/PK-specific rows are naturally concentrated among PK vendors.

---

## Executive summary

**Where Naqsha is already strong** — the live **floor → kitchen → bill → owner** operating loop:
table/floor management, KOT flow, a genuine multi-station **KDS with SLA timers and an
aggregate breach view**, split-bill POS, a **wastage-capture + owner-approval workflow**, an
owner P&L/closing dashboard, and a QR **customer-feedback** portal. Two of these — the
**wastage approval chain** and **in-app CCTV/surveillance view** — are *rare* among competitors
and are genuine differentiators.

**The biggest gaps, by priority:**

- **🔴 Critical (table-stakes we lack).** FBR/PRA fiscal-invoicing & compliance, real
  multi-tender **payments** (incl. JazzCash/Easypaisa), **inventory**, **menu/price
  administration**, **offline mode**, **online ordering + foodpanda** integration,
  **multi-branch**, and **auth/roles**. These are present in nearly every serious competitor
  and several are *legally required* to operate in Pakistan.
- **🟠 High (professional depth).** Recipe/BOM costing & food-cost %, procurement/POs,
  loyalty/CRM, WhatsApp/SMS marketing, delivery/rider dispatch, consolidated multi-branch
  reporting, item-modifiers.
- **🟡 Medium / ⚪ Low (breadth & polish).** Reservations/waitlist, combos/meal-builder,
  scheduling/payroll, self-order kiosk, multi-language/Urdu.

**Read this way:** Naqsha today is a strong *operations front-end*. To become an
"over-arching" product it needs the **back office** (inventory/recipe/procurement), the
**growth stack** (online ordering/delivery/loyalty), the **compliance layer** (FBR/PRA), and
the **platform layer** (auth/multi-branch/offline).

---

## Feature matrix

### 1 · Front-of-house / ordering

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Table management & floor plan | ✅ | **12/12** (6/6) | 🔴 | Core; Naqsha has waiter + manager floor views. |
| Tableside / handheld / captain ordering | ✅ | **11/12** (5/6) | 🔴 | Naqsha's waiter tablet UI covers this. |
| QR order-&-pay at table | ❌ | **9/12** (4/5) | 🟠 | Naqsha's QR is feedback-only, not ordering. Rising expectation. |
| KOT generation & kitchen routing | ✅ | **12/12** (6/6) | 🔴 | Naqsha strength. |
| Split / merge bills | ✅ | **10/12** (4/6) | 🟠 | Naqsha has `SplitStepper`. |
| Item modifiers / variations | 🟡 | **12/12** (6/6) | 🟠 | Universal; Naqsha cart handling is basic. |
| Course firing / seat-level ordering | ❌ | **6/12** (1/5) | 🟡 | Mostly full-service intl tools. |

### 2 · Kitchen display (KDS)

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Per-station KDS displays | ✅ | **10/12** (4/6) | 🔴 | Naqsha ships drinks/main/bbq boards. |
| Cook timers / SLA-breach flags | ✅ | **7/12** (1/6) | 🟠 | **Naqsha differentiator** — explicit SLA breach surfacing. |
| Aggregate / multi-station queue view | ✅ | **5/12** (1/4) | 🟡 | **Naqsha differentiator** (M-02). |
| Prep routing / recipe cards at station | 🟡 | **8/12** (3/5) | 🟡 | Naqsha routes by station, no recipe card. |

### 3 · Billing / POS / payments

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Core invoicing / receipts | ✅ | **12/12** (6/6) | 🔴 | Naqsha has POS invoice (M-03). |
| Discounts / deals / refunds | 🟡 | **12/12** (6/6) | 🟠 | Universal; Naqsha lacks refund/void flow. |
| Tips / service charge | 🟡 | **9/12** (3/6) | 🟡 | — |
| Multi-tender payment + gateway | ❌ | **12/12** (6/6) | 🔴 | Naqsha records, doesn't process payment. |
| Local wallets (JazzCash/Easypaisa) | ❌ | **5/12** (5/0) | 🟠 | **PK-essential**; intl tools don't have it. |
| Offline mode | ❌ | **11/12** (5/6) | 🔴 | Critical for tablet kiosks on flaky internet. |

### 4 · Tax / compliance _(Pakistan-critical)_

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| FBR digital-invoicing integration | ❌ | **4/12** (4/0) | 🔴 | **Legally mandated** for registered PK restaurants. Low global prevalence, top local priority. |
| PRA / SRB / KPRA provincial integration | ❌ | **3/12** (3/0) | 🔴 | Province-by-province sales-tax reporting. |
| QR-coded fiscal invoice | ❌ | **4/12** (4/0) | 🔴 | Ships with FBR/PRA compliance. |

### 5 · Inventory & supply

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Real-time inventory / stock | ❌ | **12/12** (6/6) | 🔴 | Biggest single back-office gap. |
| Recipe / BOM costing | ❌ | **9/12** (3/6) | 🟠 | Ties consumption to menu items. |
| Food-cost % / COGS | ❌ | **9/12** (3/6) | 🟠 | Owner-margin lever. |
| Purchase orders / procurement | ❌ | **8/12** (3/5) | 🟠 | Bill Berry & Petpooja strong here. |
| Supplier / vendor management | ❌ | **8/12** (3/5) | 🟡 | — |
| Wastage / spoilage tracking | ✅ | **6/12** (2/4) | 🟠 | **Naqsha differentiator** — capture **+ owner approval chain** is uncommon. |

### 6 · Menu management

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Menu / price administration | ❌ | **12/12** (6/6) | 🔴 | Naqsha menu is read-only mock; no admin surface. |
| Multi-menu / time-based (breakfast/happy-hour) | ❌ | **8/12** (3/5) | 🟡 | — |
| Combos / deals / meal builder | ❌ | **9/12** (4/5) | 🟡 | Very common in PK QSR. |
| Stock-driven availability toggle | ❌ | **9/12** (4/5) | 🟡 | "86" an item; ties to inventory. |

### 7 · CRM / loyalty / marketing

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Customer database / CRM | ❌ | **11/12** (5/6) | 🟠 | — |
| Loyalty / points / rewards | ❌ | **12/12** (6/6) | 🟠 | Every benchmarked vendor has it. |
| Promotions / coupons | ❌ | **11/12** (5/6) | 🟡 | — |
| SMS / WhatsApp / email marketing | ❌ | **10/12** (5/5) | 🟠 | **WhatsApp is PK-critical** for guest comms. |
| Customer feedback capture | ✅ | **7/12** (3/4) | 🟡 | Naqsha ships QR feedback (C-01). |

### 8 · Online ordering & delivery

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Own-brand online ordering (web/app) | ❌ | **12/12** (6/6) | 🔴 | Commission-free direct channel. |
| Aggregator integration (foodpanda / Zomato) | ❌ | **11/12** (5/6) | 🔴 | **foodpanda is essential** in PK. |
| Delivery / rider dispatch & tracking | ❌ | **8/12** (3/5) | 🟠 | CORN & Foodnerd ship rider apps. |
| Self-order kiosk | ❌ | **6/12** (1/5) | 🟡 | Foodics/Toast/Square/Lightspeed/Revel. |

### 9 · Reservations & waitlist

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Table reservation / booking | ❌ | **6/12** (1/5) | 🟡 | Full-service-oriented. |
| Waitlist management | ❌ | **4/12** (0/4) | ⚪ | Niche for PK cafes. |

### 10 · Reporting & analytics

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Sales / P&L reporting | 🟡 | **12/12** (6/6) | 🔴 | Naqsha owner dashboard is a daily-closing snapshot; not full reporting. |
| Item / menu performance | 🟡 | **12/12** (6/6) | 🟠 | — |
| Real-time owner dashboard | ✅ | **12/12** (6/6) | 🟠 | Naqsha has O-01. |
| Multi-branch consolidated reporting | ❌ | **10/12** (4/6) | 🟠 | Requires multi-branch layer. |

### 11 · Staff / HR

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Roles & permissions / authentication | ❌ | **12/12** (6/6) | 🔴 | Naqsha has a **session stub, no real auth** (by design, out of current scope). |
| Attendance / clock-in | ❌ | **10/12** (4/6) | 🟡 | — |
| Shift scheduling | ❌ | **7/12** (2/5) | 🟡 | — |
| Payroll | ❌ | **6/12** (2/4) | ⚪ | Often via integration. |
| Staff performance / sales-by-waiter | ❌ | **9/12** (3/6) | 🟡 | — |

### 12 · Ops / platform

| Feature | Naqsha | Instances (PK/Intl) | Priority | Notes |
|---|:--:|:--:|:--:|---|
| Multi-branch / franchise management | ❌ | **12/12** (6/6) | 🔴 | Table-stakes for scaling groups. |
| Cloud-based | ✅ | **12/12** (6/6) | 🟠 | Naqsha is a cloud SPA. |
| Native mobile app (staff/owner) | ❌ | **11/12** (5/6) | 🟡 | Naqsha is web/kiosk; competitors ship native apps. |
| CCTV / surveillance integration | ✅ | **2/12** (0/2) | 🟡 | **Rare Naqsha differentiator** (M-05 cameras). |
| Hardware ecosystem (printer/drawer/scanner) | 🟡 | **12/12** (6/6) | 🟠 | Naqsha assumes receipt/KDS hardware; not a full driver stack. |
| Multi-language / Urdu support | ❌ | **5/12** (5/0) | 🟡 | **PK-relevant**; Foodnerd advertises Urdu. |

---

## Naqsha's differentiators (defend these)

Features Naqsha already has that **most competitors do not** ship out-of-the-box:

1. **Wastage capture *with an owner-approval workflow*** — competitors track wastage, but the
   manager-submits → owner-approves control loop is uncommon.
2. **In-app CCTV / surveillance view** (M-05) — essentially unique in this set.
3. **KDS SLA-breach surfacing + cross-station aggregate view** — most KDSs show tickets;
   fewer surface breach analytics and a manager aggregate.

These map to a clear positioning: **"owner-controlled operations & loss-prevention."**

---

## Where to invest — quick wins vs strategic bets

**Quick wins** (small build, high prevalence, unlock other features):
- Menu/price **administration** surface (unblocks combos, availability, online ordering).
- **Auth + roles** (already stubbed) — prerequisite for everything multi-user/multi-branch.
- **Item modifiers** depth in the cart.

**Compliance must-do** (non-negotiable to sell in PK):
- **FBR + PRA/SRB/KPRA** integration and **QR fiscal invoices**. Low global prevalence but
  legally required — the single most important gap for a Pakistani launch.

**Strategic bets** (large, differentiating, revenue-driving):
- **Inventory + recipe costing + procurement** (the whole back office).
- **Online ordering + foodpanda + delivery/rider dispatch** (the growth stack).
- **Loyalty/CRM + WhatsApp marketing**.
- **Multi-branch platform + consolidated reporting + offline mode**.

---

## Competitor one-line positioning

| Vendor | Market | One-liner |
|---|---|---|
| **Oscar POS** | PK | Broad retail+restaurant POS; multi-branch, loyalty, works offline. |
| **Bill Berry POS** | PK/regional | Strong on production, procurement & supply-chain; franchise-oriented. |
| **Foodics** | MENA/PK | Polished cloud RMS; KDS, pay-at-table, kiosks, accounting, marketplace. |
| **CORN POS** | PK | Compliance-first (FBR/SRB/PRA/KPRA), rider app, robust offline. |
| **Foodnerd POS** | PK | FBR-integrated, Urdu support, 40+ delivery-platform integrations. |
| **CISePOS** | PK | Cloud POS with FBR/provincial tax, feedback, loyalty, offline. |
| **Toast** | Intl | Full-stack US leader; KDS, online ordering, payroll, inventory (xtraCHEF). |
| **Square for Restaurants** | Intl | Low-friction, zero-fee tier; strong payments & ecosystem. |
| **Lightspeed Restaurant** | Intl | Deep inventory & multi-location analytics. |
| **TouchBistro** | Intl | iPad table-first, strong offline, built-in reservations. |
| **Petpooja** | India | All-in-one; aggregators, recipe, captain app, huge marketplace. |
| **Revel Systems** | Intl | Enterprise iPad POS; always-on offline, ingredient-level inventory. |

---

## Method & sources

- **Baseline (Naqsha):** derived directly from this repo — `README.md`, `PROGRESS.md`,
  `src/routes/*`, `src/lib/api/endpoints.ts` (11 role-based screens + realtime stub).
- **Competitors:** each feature verified against the vendor's own site or a reputable
  comparison before an instance was counted. `SnappRetail` (from the original brief) was
  dropped as it is a **retail-merchant** app rather than a restaurant POS; **CISePOS** was
  substituted as a genuine PK restaurant POS.
- **Priority basis:** blended — market prevalence weighted by fit for a Pakistani
  cafe/restaurant (compliance and local-payment/delivery rows are elevated even where global
  prevalence is low).
- Counts are best-effort estimates from marketing/feature material and can shift with vendor
  releases; treat them as directional, not audited SLAs.

**Primary sources:** oscar.pk · billberrypos.com · foodics.com · cornpos.com ·
foodnerdpos.com · cisepos.com · pos.toasttab.com · squareup.com · lightspeedhq.com ·
touchbistro.com · petpooja.com · revelsystems.com — plus 2026 comparison roundups
(owner.com, capterra, softwaresuggest, upmenu, restaurantlaunchpad).
