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
| M-05 | `/manager/cameras` | desktop |
| O-01 | `/owner/dashboard` | desktop → 375 |
| O-02 | `/owner/wastage` | desktop → 375 |
| C-01 | `/feedback/:tableSlug` | 375 phone, public |

`/dev/components` is a dev-only gallery of the design-system primitives plus a
link index to every screen. Each route is a lazy import, so a kiosk only pulls
its role's chunk on cold load.

## Design tokens

The palette, fonts (Space Grotesk / Inter / JetBrains Mono), and radius scale
live in **`tailwind.config.ts`** (`theme.extend`) and are mirrored as CSS custom
properties in **`src/styles/tokens.css`**. Tailwind config is the source of
truth — never inline hex in components; compose classes with `cn()`
(`src/lib/utils.ts`). Global base styles, focus rings, and the reduced-motion
guard are in `src/styles/globals.css`.

Signature primitives are under `src/components/naqsha/` (`CornerTicks`,
`SheetRef`, `Chip`, `StatTile`, `DataRow`, …); restyled form controls under
`src/components/ui/`; role shells under `src/components/layouts/`.

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

When the contract lands, edit **only `src/lib/api/*`** (and
`src/lib/realtime/socket.ts` for the real socket). Replace the `mockGet(...)`
bodies with real `fetch` calls, keep parsing each response through its existing
Zod schema, and keep the same return types. Hooks, components, types, and mock
data can stay untouched — delete `src/lib/mocks/*` once every endpoint is live.

## Conventions

TypeScript strict (`noUncheckedIndexedAccess`, no `any`). No default exports
except route components. No barrel files. Server state → TanStack Query;
cross-component UI state → Zustand (`src/stores/`); ephemeral → `useState`.
Auth, admin/config surfaces, and real Frappe endpoints are intentionally out of
scope.
