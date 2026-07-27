# Naqsha — Feature Roadmap (v1 · v1.1 · v2)

> Product roadmap segmenting every feature we are building into **v1 (launch)**,
> **v1.1 (fast-follow)**, and **v2 (scale & growth)**. Derived from the built screens
> + `docs/FEATURE_COMPARISON.md` gaps, targeting a **Frappe/ERPNext + HRMS** backend.
> Refined against competitor research (see `## Market research` at the bottom).
>
> **Legend:** ✅ built · 🛠️ built as mock (needs live Frappe) · 🔜 planned this cycle · ❌ not started.
> **Backend:** the DocType/module that powers it (see `docs/BACKEND_DOCTYPE_REQUIREMENTS.md`).

---

## ⚠ Scope change — 2026-07-25

This app is now the **in-restaurant staff/owner console only**. Three things were removed:

- **Own online ordering (delivery + pickup)** and the **aggregator inbox** + **delivery
  dispatch** → moving to a **separate customer web app**. In-restaurant **dine-in QR order**
  (`/order/:table`) and the **kiosk** (`/kiosk`) stay here.
- **Manager Checkout screen** → removed as redundant; multi-tender payment + **FBR fiscal
  receipt** now live on the **POS screen** (`/manager/pos/:table`).
- **Login role picker** → replaced by a plain **username + password** screen (the role comes
  from the Frappe user in production).

Also: **CCTV** is now wired to **real Hikvision streams** (HDMI → capture → MediaMTX/go2rtc →
HLS/WebRTC), and KDS **SLA timers tick live** from a real timestamp — see
`docs/CAMERA_HIKVISION_SETUP.md` and `docs/SCREEN_API_MAP.md`.

---

## Segmentation principle

- **v1 = a single cafe/restaurant can legally run end-to-end** — dine-in floor→kitchen→
  bill→pay, PK tax compliance, own online ordering (delivery + pickup) with a real
  customer identity, a working loyalty loop, and role-based navigation that is usable on
  the actual devices (tablet, phone, desktop).
- **v1.1 = depth that raises revenue & retention** — CRM, marketing, combos, recipe
  costing, purchasing, reservations, staff ops, aggregator intake.
- **v2 = multi-outlet scale & advanced automation** — multi-branch, payroll, live rider
  tracking, deep analytics, loyalty tiers, localization, native apps.

---

## Cross-cutting foundation (v1 — do first, unblocks everything)

| # | Feature | Status | Notes |
|---|---|:--:|---|
| F-1 | **Role navigation shells** — waiter & owner get a sidebar like the manager rail | 🔜 | One responsive `RoleShell` + per-role nav config |
| F-2 | **Responsive layouts** — tablet + phone breakpoints, collapsible nav drawer | 🔜 | Waiter=tablet, KDS=wall, manager/owner=desktop→tablet, customer=phone |
| F-3 | **Customer identity** — phone **or** email as unique customer key across cafe + web | 🔜 | ERPNext `Customer` (mobile_no/email_id); ties orders → loyalty |
| F-4 | **Auth & roles** (login, role-gated routes) | ❌ | Frappe user/role; deferred earlier — confirm for v1 |

---

## v1 — Launch (market-ready core)

### Front of house / ordering
| Feature | Route | Status | Backend |
|---|---|:--:|---|
| Table & floor plan (waiter + manager) | `/waiter/tables`, `/manager/floor` | ✅ | Restaurant Table |
| Tableside ordering + cart | `/waiter/tables/:id` | ✅ | Sales Order |
| Item modifiers / variations · course & seat | (in cart) | ✅ | Item Variant + KOT Item |
| KOT generation & station routing | — | ✅ | KOT |

### Kitchen
| KDS station board + SLA timers/breach | `/kds/:station` | ✅ | KOT + KDS Station |
| Manager KDS aggregate (cross-station) | `/manager/kds` | ✅ | KOT aggregate |
| Recipe / prep card at station | (in KotCard) | ✅ | BOM |

### Billing / payments / compliance
| Core POS invoice + receipts | `/manager/pos/:id` | ✅ | POS Invoice |
| **Multi-tender payment** (cash/card/split) | `/manager/checkout/:id` | 🛠️ | POS Invoice + Mode of Payment |
| **Local wallets** (JazzCash / Easypaisa) | `/manager/checkout/:id` | 🛠️ | Mode of Payment |
| Service charge · basic discount | `/manager/checkout/:id` | 🛠️ | Sales Taxes / Pricing Rule |
| **FBR fiscal invoice + provincial tax + QR** | (on receipt) | 🛠️ | custom fields + FBR integration |
| Offline indicator + outbox | (top bar) | 🛠️ | client queue → POS Invoice |

### Menu & inventory (minimum)
| Menu / price administration + 86 toggle | `/manager/menu` | 🛠️ | Item / Item Price |
| Stock levels + low-stock flags | `/manager/inventory` | 🛠️ | Bin / Item |
| Wastage capture + owner approval | `/manager/wastage`, `/owner/wastage` | ✅ | Wastage Entry (Workflow) |

### Owner
| Real-time owner dashboard (closing P&L) | `/owner/dashboard` | ✅ | owner_dashboard() |
| Sales / P&L report | `/owner/reports` | 🛠️ | P&L query report |

### Customer-facing (delivery · pickup · feedback)
| **Own online ordering** — delivery + pickup | `/store` | 🔜 | Sales Order |
| **Customer registration at checkout** (name, phone/email, address) | `/store` checkout | 🔜 | Customer + Address |
| QR order-&-pay at table | `/order/:slug` | ✅ | Sales Order / POS Invoice |
| QR feedback portal | `/feedback/:slug` | ✅ | Customer Feedback |
| **Loyalty points — earn on every cafe + web order**, keyed by phone/email | all order flows | 🔜 | Loyalty Program + Loyalty Point Entry |

### Ops / platform
| CCTV / surveillance view (differentiator) | `/manager/cameras` | ✅ | stream config |

---

## v1.1 — Fast-follow (depth, retention, revenue)

| Feature | Route | Status | Backend |
|---|---|:--:|---|
| Customer database / CRM profiles | `/manager/customers` | 🛠️ | Customer / Contact |
| **Loyalty redemption + tiers** (spend points at POS/web) | POS + storefront | 🔜 | Loyalty Program |
| Marketing — WhatsApp / SMS / email campaigns | `/manager/marketing` | 🛠️ | Email Campaign / SMS |
| Promotions / coupons | `/manager/marketing` | 🛠️ | Pricing Rule + Coupon |
| Combos / meal builder | `/manager/menu` | 🛠️ | Product Bundle |
| Time-based menus (breakfast/happy-hour) | `/manager/menu` | 🛠️ | Price List + Pricing Rule |
| Recipe / BOM costing · food-cost % | `/manager/inventory` | 🛠️ | BOM |
| Purchase orders + suppliers | `/manager/purchasing` | 🛠️ | Purchase Order / Supplier |
| Reservations + waitlist | `/manager/reservations` | 🛠️ | Table Reservation / Waitlist |
| Staff attendance + performance + shifts | `/owner/staff` | 🛠️ | Employee Checkin / Shift |
| Item / menu performance report | `/owner/reports` | 🛠️ | Sales Analytics |
| **Aggregator (foodpanda) order inbox** | `/manager/online` | 🛠️ | Aggregator Order |
| Self-order kiosk | `/kiosk` | 🛠️ | Sales Order |
| Refund / void flow | checkout | ❌ | Sales Return / cancel |

---

## v2 — Scale & growth (multi-outlet, automation)

| Feature | Status | Backend |
|---|:--:|---|
| Multi-branch / franchise switcher | ❌ | Company / Branch |
| Multi-branch consolidated reporting | 🛠️ | Consolidated Financial Statement |
| **Delivery / rider dispatch + live tracking** | 🛠️ | Delivery Trip / Driver |
| Payroll (view + run link-out) | 🛠️ | Salary Slip / Payroll Entry |
| Procurement automation / auto-reorder | ❌ | Reorder + Material Request |
| Loyalty rewards catalogue + tiers | ❌ | Loyalty Program |
| Advanced analytics / cohort & retention | ❌ | reports |
| Multi-language / Urdu (RTL) | ❌ | i18n layer |
| Native mobile apps (staff / customer) | ❌ | separate RN project |
| Payment gateway (card-not-present, web) | ❌ | gateway integration |

---

## Market research

Findings from 2025–26 competitor & best-practice research (sources below), and how they
shape the roadmap:

**Loyalty (Toast, SpotOn, Chowbus, Rezku, LINGA).**
- **Phone number is the universal cross-channel identifier**; email/card are secondary.
  → v1 loyalty keys on **phone (primary), email (optional)**, unique on `Customer`.
- Points **earn automatically at checkout** (per amount spent) and **redeem by scanning /
  entering the phone** — no card needed. → earn in v1 (cafe QR + web + POS); redeem in v1.1.

**Pakistan POS (itKINS, EloERP, OzPos, Tecveq, OnlineOrder.pk).**
- **JazzCash, Easypaisa, and Cash-on-Delivery are make-or-break** — missing them = checkout
  abandonment. → **COD added to v1** delivery/pickup alongside wallets.
- **foodpanda / Careem + own website orders should land directly in the kitchen queue**
  (no manual re-entry). → aggregator inbox routes to KDS (v1.1); own web → KOT (v1).
- Multi-branch unified dashboard (v2) and **offline sync** (v1) are expected baseline.

**Online ordering checkout (Toast, ChowNow, Restolabs, Chowbus).**
- **Forced registration raises abandonment ~23% → offer guest checkout**, with **optional**
  account (phone/email/social) to save address, past orders, and earn loyalty. → v1 checkout
  = **one-page, guest-first, with an opt-in "save my details / join rewards"** that creates
  the `Customer`. This directly fixes the current delivery page (no customer identity).
- **One-page checkout** reduces abandonment; **live order tracking + SMS/WhatsApp status**
  updates are expected → basic status (v1.1), live rider tracking (v2).

### Roadmap adjustments from research
- v1 customer checkout now specifies: **name + phone (required), email/address (as needed),
  guest-or-save toggle, COD + wallet + card tenders, one-page flow.**
- v1 loyalty scope clarified to **earn + balance lookup by phone/email**; redemption → v1.1.

**Sources:** [Toast — loyalty](https://pos.toasttab.com/blog/on-the-line/restaurant-loyalty-program-ideas) ·
[Rezku — POS loyalty guide](https://rezku.com/blog/pos-loyalty-program/) ·
[Chowbus — loyalty](https://www.chowbus.com/products/restaurant-loyalty-programs) ·
[itKINS — best PK POS](https://itkins.com/best-restaurant-pos-software/) ·
[EloERP — POS buyer's guide](https://eloerp.net/blog/restaurant-pos-system-buyers-guide/) ·
[OnlineOrder.pk — foodpanda commission](https://onlineorder.pk/foodpanda-commission-rate-pakistan/) ·
[Restolabs — ordering best practices](https://www.restolabs.com/blog/online-ordering-best-practices) ·
[ChowNow — website best practices](https://get.chownow.com/blog/restaurant-website-best-practices-and-examples/)

---

## Open decisions

1. **Auth in v1?** Earlier removed; but multi-role nav + loyalty (customer identity) make a
   login surface valuable. Recommend a lightweight staff login for v1.
2. **Loyalty unique key** — phone is near-universal in PK; email optional. Recommend
   **phone primary, email secondary**, both unique on `Customer`.
3. **Payment gateway** — v1 records tenders (incl. wallets) but true online card capture on
   the web storefront needs a gateway (v2) unless a wallet redirect covers it.
