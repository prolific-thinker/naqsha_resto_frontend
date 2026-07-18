# Naqsha Frontend — Handover Brief

**For:** the next Claude session that will scaffold and build the React SPA.
**From:** the design + backend planning session that produced `naqsha-mockups.html`.

Read this end-to-end before writing a single line of code. Everything you need to make consistent decisions without asking me is here.

---

## 1. Mission

Build a single React + TypeScript SPA that serves 5 role-based UIs for a cafe POS/KDS/manager/owner/customer-feedback system. Every screen is already designed — see the mockups. Your job is to translate those mockups into a production-quality Vite SPA with a clean component library, mocked data (API contract not frozen yet), and route-based code splitting.

**One dev on this project. Direct, terse output. No hand-holding, no over-explaining, no asking permission for obvious choices. Ship code.**

---

## 2. Mockup source (this is the spec)

- File: `naqsha-mockups.html` (single-file HTML, all 11 screens, sidebar nav)
- Every screen has a **sheet reference code**: A-01, A-02, K-01, M-01..M-05, O-01, O-02, C-01. Use these codes as the source-of-truth screen IDs throughout the codebase (route paths, component names, folder names).
- Every color, spacing, font, and layout choice in that HTML is deliberate — port it exactly.

---

## 3. Tech stack — locked

Do not deviate. Do not propose alternatives.

- **Vite + React 18 + TypeScript strict mode**
- **Tailwind CSS** (with tokens configured from the mockup CSS variables)
- **shadcn/ui** primitives — installed via CLI, then restyled with Naqsha tokens
- **React Router v6** (not TanStack Router)
- **Zustand** for local UI state (not Redux, not Context gymnastics)
- **TanStack Query** for server state (mocked adapters now, real endpoints later)
- **Zod** for runtime validation of all API responses
- **pnpm** as package manager
- **date-fns** for date/time (not moment, not dayjs)
- **lucide-react** for icons (matches the mockup's simple line style)

Node 18, packaged with the rest of the monorepo-adjacent tooling.

---

## 4. Design system

### Palette (copy verbatim into `tailwind.config.ts` theme.extend.colors)

```
ink:      #0F1620    ink-2:  #1A1F2A    ink-3:  #232935
paper:    #F7F4EC    paper-2:#FBF9F3    paper-3:#EFEAD9    paper-4:#E6DFCC
teal:     #124C5A    teal-2: #1B6674    teal-3: #E8F1F2
saffron:  #DFA02B    saffron-2:#F5D888
success:  #2E7D5B    success-2:#DFEEE4
alert:    #B8362B    alert-2:  #F5DAD5
amber:    #C2620F    amber-2:  #F7E4C7
muted:    #736C60    muted-2:  #A69E90
line:     #D8D1C0    line-2:   #C4BCA9    line-strong:#A69E90
```

### Fonts (Google Fonts, load in `index.html`)

- **Display:** Space Grotesk (500, 600, 700) — headings, table numbers, big values
- **Body:** Inter (400, 500, 600) — everything readable
- **Mono:** JetBrains Mono (400, 500, 600) — **all** data, sheet refs, timers, currency values

### Signature elements (must appear on every screen)

1. **Corner registration ticks** on cards — implement as `<CornerTicks />` component. 10×10px L-shapes at each corner of a card, 1.5px teal border. Absolute-positioned, `pointer-events: none`.
2. **Sheet reference codes** in mono type, uppercase, `letter-spacing: 0.06em–0.10em`, `text-muted`. Format: `A-01`, `T-05`, `KOT-D-1042`, `INV-C-2026-0234`, `WST-C-2026-0018`. Codes appear next to titles, in table cells, in badges. This is the identity signal.
3. **Category chips** — small pill badges (`chip-teal`, `chip-amber`, `chip-success`, `chip-alert`, `chip-muted`, `chip-ink`) with mono font, uppercase, 10px. Never use full-color solid buttons for status — use these chips.

### What NOT to do (aesthetic guardrails)

- **No cream + terracotta serif** — that's the Anthropic-cream AI-generated tell.
- **No near-black + neon acid green.**
- **No broadsheet hairline serif.**
- **No default shadcn violet/slate.**
- No emojis in UI copy, ever. Icons via lucide-react only.
- No `border-radius: 12px+` — the mockups are disciplined at 4–8px. Anything bigger reads as SaaS-generic.

---

## 5. Screens (all 11)

Every screen has a corresponding section in `naqsha-mockups.html` — open it, look at the section with matching ID, port it. Do not invent your own layout.

| Sheet ref | Route | Component | Device target | Notes |
|---|---|---|---|---|
| A-01 | `/waiter/tables` | `WaiterFloor` | 1024×768 tablet | Table grid + takeaway lane |
| A-02 | `/waiter/tables/:tableId` | `WaiterMenuCart` | 1024×768 tablet | Category rail + menu + cart |
| K-01 | `/kds/:station` | `KdsStation` | 1920×1080 wall display | Queue → Active → Prepared 3-column. Route param `station` = `drinks` \| `main` \| `bbq`. Palette-swap by param. |
| M-01 | `/manager/floor` | `ManagerFloor` | 1440×900 desktop | Table grid + stat tiles |
| M-02 | `/manager/kds` | `ManagerKdsAggregate` | 1440×900 desktop | Row per table, all stations, dispatch action |
| M-03 | `/manager/pos/:tableId` | `ManagerPos` | 1440×900 desktop | Bill preview + split + MOP |
| M-04 | `/manager/wastage` | `ManagerWastage` | 1440×900 desktop | New wastage entry form |
| M-05 | `/manager/cameras` | `ManagerCameras` | 1440×900 desktop | 4-cam grid |
| O-01 | `/owner/dashboard` | `OwnerDashboard` | 1440×900 desktop, responsive to 375 | Day/Week/Month/Quarter tabs + P&L |
| O-02 | `/owner/wastage` | `OwnerWastageApprovals` | 1440×900 desktop, responsive to 375 | Approval queue |
| C-01 | `/feedback/:tableSlug` | `CustomerFeedback` | 375×812 phone only | Public route, no auth |

---

## 6. Architecture

```
naqsha-frontend/
├── src/
│   ├── main.tsx                      # providers: Router, QueryClient
│   ├── App.tsx                       # route table
│   ├── routes/
│   │   ├── waiter/
│   │   │   ├── floor.tsx             # A-01
│   │   │   └── menu-cart.tsx         # A-02
│   │   ├── kds/
│   │   │   └── station.tsx           # K-01 (theme by :station param)
│   │   ├── manager/
│   │   │   ├── floor.tsx             # M-01
│   │   │   ├── kds-aggregate.tsx     # M-02
│   │   │   ├── pos.tsx               # M-03
│   │   │   ├── wastage.tsx           # M-04
│   │   │   └── cameras.tsx           # M-05
│   │   ├── owner/
│   │   │   ├── dashboard.tsx         # O-01
│   │   │   └── wastage-approvals.tsx # O-02
│   │   └── feedback/
│   │       └── customer.tsx          # C-01
│   ├── components/
│   │   ├── ui/                       # shadcn primitives (Button, Badge, Input, ...)
│   │   ├── naqsha/                   # design-system primitives
│   │   │   ├── CornerTicks.tsx
│   │   │   ├── SheetRef.tsx
│   │   │   ├── Chip.tsx              # variants: teal/amber/success/alert/muted/ink
│   │   │   ├── StatTile.tsx
│   │   │   ├── DataRow.tsx
│   │   │   └── DeviceFrame.tsx       # dev-only, wraps screens in device sizing for review
│   │   ├── kot/
│   │   │   ├── KotCard.tsx           # states: queued|preparing|breach|prepared
│   │   │   └── KotTimer.tsx
│   │   ├── table/
│   │   │   └── TableCard.tsx         # states: free|mine|occupied|active|breach|ready|feedback|billing
│   │   ├── bill/
│   │   │   ├── BillLine.tsx
│   │   │   ├── BatchMarker.tsx
│   │   │   └── SplitStepper.tsx
│   │   └── layouts/
│   │       ├── WaiterShell.tsx       # top bar + tablet tabs
│   │       ├── KdsShell.tsx          # dark theme, station header
│   │       ├── ManagerShell.tsx      # icon rail + top bar + main
│   │       ├── OwnerShell.tsx        # top block with period tabs
│   │       └── PhoneShell.tsx        # customer feedback
│   ├── lib/
│   │   ├── mocks/                    # ALL mock data lives here
│   │   │   ├── tables.ts
│   │   │   ├── kots.ts
│   │   │   ├── menu.ts
│   │   │   ├── bills.ts
│   │   │   ├── wastage.ts
│   │   │   ├── feedback.ts
│   │   │   └── owner-stats.ts
│   │   ├── api/                      # typed wrappers — swap mocks for real later
│   │   │   ├── client.ts             # single fetch client, currently returns mocks
│   │   │   ├── orders.ts
│   │   │   ├── kitchen.ts
│   │   │   ├── pos.ts
│   │   │   ├── wastage.ts
│   │   │   ├── feedback.ts
│   │   │   └── owner.ts
│   │   ├── realtime/
│   │   │   └── socket.ts             # stub, publishes fake events on interval
│   │   └── format.ts                 # currency, time, duration, table refs
│   ├── hooks/
│   │   ├── useOpenTables.ts
│   │   ├── useKotStream.ts
│   │   ├── useSlaBreaches.ts
│   │   └── useSessionMeta.ts
│   ├── stores/
│   │   ├── cart.ts                   # zustand
│   │   └── session.ts                # zustand (waiter identity, branch)
│   ├── types/
│   │   ├── domain.ts                 # Table, KOT, POSInvoice, Item, Wastage, etc.
│   │   └── api.ts                    # request/response types
│   └── styles/
│       ├── tokens.css                # CSS custom properties (mirror Tailwind config)
│       └── globals.css
├── index.html
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### Route splitting

Every route is a lazy import. Kiosks pull only their role's chunk on cold load.

```ts
const WaiterFloor = lazy(() => import('./routes/waiter/floor'));
```

---

## 7. Data layer — mocked now, real later

**Backend API contract (`naqsha_api.md`) is NOT frozen.** Do not invent endpoint URLs. Do not couple components to specific endpoint shapes.

Instead:

1. Define domain types in `types/domain.ts` — these are the ground truth (`Table`, `KOT`, `POSInvoice`, `Item`, etc.).
2. Wrap every data need in a typed hook (`useOpenTables()`, `useKotStream('drinks')`, etc.).
3. Each hook currently calls a function in `lib/api/*.ts` which returns mock data from `lib/mocks/*.ts` with a 100–400ms simulated delay.
4. When the API contract lands, only `lib/api/*.ts` changes — components, hooks, and types stay stable.

Use realistic Pakistani cafe sample data (see mockups): karak chai, chicken karahi, beef bihari, PKR currency, waiter names Ahmed/Bilal/Chirag, KOT refs `KOT-D-1042`, invoice refs `INV-C-2026-0234`, wastage refs `WST-C-2026-0018`, tables `T-01`..`T-10`, takeaway `TAKE-041`.

### Realtime stub

`lib/realtime/socket.ts` exposes:

```ts
subscribe(channel: string, handler: (payload: unknown) => void): () => void;
```

The stub publishes fake KOT state transitions every 8 seconds so KDS timers and manager aggregate views feel alive. When the real socket lands, only this file changes.

---

## 8. Coding standards

- **TypeScript strict**, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` all on.
- **No `any`.** Ever. If you're tempted, define an unknown type and narrow.
- **No default exports** except for route components (React Router expects them).
- **No barrel `index.ts` files** — direct imports only. Reason: preserves Vite tree-shaking, keeps grep useful.
- **Zod for API validation**: every response through `lib/api/*` gets parsed by a Zod schema before returning. Runtime type safety, not just compile-time.
- **Component conventions:**
  - Functional components only.
  - Props type declared inline above the component (`type Props = { ... }`).
  - `className` prop supported on every leaf component, merged with `clsx`.
  - Never spread `...rest` props onto DOM elements — be explicit.
- **State conventions:**
  - Server state → TanStack Query.
  - Ephemeral UI state → local `useState`.
  - Cross-component UI state (cart, session) → Zustand.
  - **No React Context except for the QueryClient and Router.** No custom context providers.
- **Tailwind conventions:**
  - Use tokens from config, never inline hex.
  - Compose classes with `cn()` (shadcn's clsx+tailwind-merge helper).
  - No arbitrary values (`w-[473px]`) unless there's no config alternative — and if used, comment why.
- **File naming:** kebab-case for files, PascalCase for exported components, camelCase for functions and hooks.
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`). One screen or one primitive per commit.

---

## 9. Order of work (do these in this order — do not skip ahead)

### Phase 0 — scaffold
1. `pnpm create vite naqsha-frontend --template react-ts`
2. Install deps: `tailwindcss postcss autoprefixer @tanstack/react-query react-router-dom zustand zod clsx tailwind-merge lucide-react date-fns`
3. `pnpm dlx shadcn@latest init` → configure with the Naqsha palette
4. Load Google Fonts in `index.html`
5. Port palette + fonts + core CSS variables to `tailwind.config.ts` + `tokens.css`
6. Set up React Router with placeholder routes returning `null`
7. Commit: `chore: vite scaffold + design tokens`

### Phase 1 — design system primitives
Build in this order, each with a Storybook-adjacent test route at `/dev/components`:
1. `<CornerTicks />`
2. `<SheetRef />`
3. `<Chip />` (all variants)
4. `<StatTile />`
5. `<DataRow />`
6. Refined shadcn `<Button />`, `<Input />`, `<Textarea />`, `<Select />` — restyled to Naqsha tokens
7. Commit: `feat: naqsha design-system primitives`

### Phase 2 — layouts
1. `<WaiterShell />`
2. `<KdsShell />`
3. `<ManagerShell />` — the icon rail is the biggest piece; make it a proper `<NavRail />` component
4. `<OwnerShell />`
5. `<PhoneShell />`
6. Commit: `feat: role-based layout shells`

### Phase 3 — data layer mocks
1. Domain types (`types/domain.ts`)
2. Zod schemas (`types/api.ts`)
3. Mock generators (`lib/mocks/*.ts`)
4. API client shim (`lib/api/*.ts`)
5. Realtime stub (`lib/realtime/socket.ts`)
6. Hooks (`hooks/*.ts`)
7. Commit: `feat: mocked data layer + realtime stub`

### Phase 4 — screens
Build in this order (easiest → hardest):
1. **C-01** Customer feedback (simplest, isolated route)
2. **A-01** Waiter floor
3. **A-02** Waiter menu + cart
4. **K-01** KDS station (drinks first, then verify theme-swap works for main + bbq)
5. **M-01** Manager floor
6. **M-04** Manager wastage
7. **M-05** Manager cameras (fake video with CSS gradients — no real streams yet)
8. **M-02** Manager KDS aggregate
9. **M-03** Manager POS/billing (most complex — split stepper, batch markers)
10. **O-01** Owner dashboard
11. **O-02** Owner wastage approvals

**One commit per screen.** Message format: `feat(A-01): waiter floor`.

### Phase 5 — polish
- Keyboard focus rings (2px teal offset, always visible)
- `prefers-reduced-motion` respected
- Responsive check on O-01 and O-02 down to 375px
- Empty states for every list view
- Loading skeletons for every query

---

## 10. Deliverables checklist

- [ ] `pnpm dev` starts on port 5173
- [ ] `pnpm build` produces a shippable dist
- [ ] Every route from the table in §5 is reachable and renders the screen
- [ ] Every screen matches its mockup section within ~2% pixel tolerance
- [ ] Every list has: loading state, empty state, error state
- [ ] TypeScript: `pnpm tsc --noEmit` passes with zero errors
- [ ] Lint: `pnpm eslint .` passes with zero warnings (configure eslint-config-strict)
- [ ] `README.md` explains: how to run dev, how to swap mocks for real API, where design tokens live

---

## 11. What you don't do

- **Don't wire real Frappe endpoints yet.** The contract isn't frozen. Mocks only.
- **Don't build auth.** Kiosks assume a hard-coded session for now. `src/stores/session.ts` returns a stub waiter/manager/owner identity based on route.
- **Don't build the config/admin surface.** No settings pages, no user management. Just the 11 screens.
- **Don't skip the design-system phase and build screens directly.** You will drift and it will look inconsistent.
- **Don't propose a state management library other than Zustand + TanStack Query.**
- **Don't ask "should I use X or Y" for things already decided in §3, §5, §6, §8. Just build.**

---

## 12. If you're blocked

Blockers that are legitimate:
- A mockup section is genuinely ambiguous → open `naqsha-mockups.html`, screenshot the specific area, ask a targeted question.
- A domain modeling question that can't be answered from the mockups (e.g. "does a KOT belong to one station or many?") → ask, in one sentence, with your proposed answer inline.

Blockers that are not legitimate:
- "Which UI library should I use?" — see §3.
- "How should I structure state?" — see §8.
- "Should I add feature X that's not in the mockups?" — no.

Ship it.
