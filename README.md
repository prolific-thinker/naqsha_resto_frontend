# Naqsha Frontend

Single React + TypeScript SPA serving five role-based UIs for a cafe
POS/KDS/manager/owner/customer-feedback system. Every screen is ported from
`naqsha-mockups.html`; the handover brief is in `naqsha-frontend-handover.md`.

Target runtime: Chromium kiosks on Android tablets + evergreen desktop Chrome.

## Stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · React Router v6 ·
TanStack Query · Zustand · Zod · date-fns · lucide-react. Package manager: **pnpm**.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5173  (redirects to /dev/components)
pnpm build      # typecheck + production build to dist/
pnpm preview    # serve the built dist/
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint .
```

> First install runs esbuild's build script (allow-listed in `pnpm-workspace.yaml`).

## Demo logins

The login screen is a plain **username + password** form (no role picker). Until Frappe auth
is wired, the role is derived from the username; **any non-empty password** works.

| Screen type | Username | Lands on |
|---|---|---|
| Manager (full console) | `manager` | `/manager/floor` |
| Owner (dashboards) | `owner` | `/owner/dashboard` |
| Waiter (floor/orders) | `waiter` | `/waiter/tables` |
| Kitchen / KDS | `kitchen` | `/kds/main` |

Aliases: `chef`/`kds` → kitchen, `server` → waiter, `admin` → manager. In production the role
comes from the Frappe user's roles, not the username — see `docs/INTEGRATION.md §5`.

## Docs (start here for backend wiring)

- **`docs/INTEGRATION.md`** — how the frontend connects to Frappe + a day-by-day plan.
- **`docs/SCREEN_API_MAP.md`** — every screen → hook → endpoint → DocType, with render snippets.
- **`docs/BACKEND_WORKFLOWS.md`** — the state machines + exact API calls per flow.
- **`docs/BACKEND_DOCTYPE_REQUIREMENTS.md`** — the DocType/field crosswalk.
- **`docs/CAMERA_HIKVISION_SETUP.md`** — Hikvision HDMI → gateway → in-app CCTV.
- **`docs/FEATURE_ROADMAP.md`** — v1/v1.1/v2 scope (incl. the 2026-07-25 scope change).

## Screens

| Sheet | Route | Device |
|---|---|---|
| A-01 | `/waiter/tables` | 1024×768 tablet |
| A-02 | `/waiter/tables/:tableId` | 1024×768 tablet |
| K-01 | `/kds/:station` (`drinks`\|`main`\|`bbq`) | wall display |
| M-01 | `/manager/floor` | 1440×900 desktop |
| M-02 | `/manager/kds` | desktop |
| M-03 | `/manager/pos/:tableId` | desktop |
| M-04 | `/manager/wastage` | desktop |
| M-05 | `/manager/cameras` (Hikvision streams) | desktop |
| — | `/manager/menu` · `/manager/inventory` · `/manager/purchasing` | desktop |
| — | `/manager/customers` · `/manager/marketing` · `/manager/reservations` | desktop |
| O-01 | `/owner/dashboard` | desktop → 375 |
| O-02 | `/owner/wastage` | desktop → 375 |
| — | `/owner/reports` · `/owner/staff` | desktop |
| C-01 | `/feedback/:tableSlug` | 375 phone, public |
| — | `/order/:tableSlug` (dine-in QR) · `/kiosk` | phone / kiosk, public |

> Removed 2026-07-25: `/store` (web delivery/pickup), `/manager/online`, `/manager/checkout`
> — see `docs/FEATURE_ROADMAP.md`. Payment + FBR receipt now live on `/manager/pos/:tableId`.

`/dev/components` is a dev-only gallery of the design-system primitives plus a
link index to every screen. Each route is a lazy import, so a kiosk only pulls
its role's chunk on cold load.

## Design tokens

A **warm hospitality** palette (warm off-white paper, warm charcoal ink, a deep herb-green
primary + earthy terracotta/amber secondary), fonts (**Fraunces** display / **Inter** body /
JetBrains Mono for figures), and the radius scale live in **`tailwind.config.ts`**
(`theme.extend`), mirrored as CSS custom properties in **`src/styles/tokens.css`**. Tailwind
config is the source of truth — never inline hex; compose classes with `cn()`
(`src/lib/utils.ts`). Global base styles, focus rings, and the reduced-motion guard are in
`src/styles/globals.css`.

Primitives are under `src/components/naqsha/` (`Chip`, `StatTile`, `DataRow`, `Tabs`, …);
restyled form controls under `src/components/ui/`; role shells under
`src/components/layouts/`. (`CornerTicks` is deprecated — a no-op kept only for call-site
compatibility; the blueprint corner-brackets and mono ref-codes were dropped in the redesign.)

## Data layer — mocks now, real API later

The backend contract is **not frozen**, so nothing is coupled to endpoint
shapes:

- **`src/types/domain.ts`** — ground-truth domain types. Components and hooks
  depend only on these.
- **`src/types/api.ts`** — Zod schemas; the runtime validation boundary.
- **`src/lib/mocks/*`** — in-memory sample data (realistic PK cafe data).
- **`src/lib/api/*`** — typed endpoint wrappers. Today they resolve mock data
  through `client.ts` (`mockGet`/`mockPost`) with simulated latency and Zod
  validation.
- **`src/hooks/*`** — TanStack Query hooks the screens call.
- **`src/lib/realtime/socket.ts`** — `subscribe(channel, handler)` stub that
  publishes fake KOT transitions every 8s.

### Swapping in the real API

When the contract lands, flip `VITE_USE_MOCKS=false` (or migrate one getter at a time) and
edit **only `src/lib/api/*`** (and `src/lib/realtime/socket.ts` for the real socket). Each
getter already switches mock↔`httpGet` on the same Zod schema, so hooks, components, types,
and mock data stay untouched — delete `src/lib/mocks/*` once every endpoint is live. The full
recipe (auth headers, CSRF/token, realtime, offline outbox, whitelisted methods, a day-by-day
plan) is in **`docs/INTEGRATION.md`**.

## Conventions

TypeScript strict (`noUncheckedIndexedAccess`, no `any`). No default exports
except route components. No barrel files. Server state → TanStack Query;
cross-component UI state → Zustand (`src/stores/`); ephemeral → `useState`.
Lightweight client auth (`src/stores/session.ts` + `RequireAuth`) is in place; real Frappe
endpoints are wired via the mock↔HTTP switch (see `docs/INTEGRATION.md`).
