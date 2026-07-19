# Naqsha Frontend — Project State & Continuation Notes

Shared reference for resuming work (survives a cleared chat). Last updated after
adding the backend env-switch and integration docs.

## Status: build complete ✅

All 6 handover phases done; all 11 screens built, each visually verified against
`naqsha-mockups.html` and committed individually. Pushed to `main` on
`git@github.com:prolific-thinker/naqsha_resto_frontend.git`.

Gates (all green): `pnpm typecheck` · `pnpm lint` (0 warnings) · `pnpm build`
(per-route lazy chunks).

## What exists

- **Scaffold:** Vite + React 18 + TS strict, Tailwind tokens from the mockup,
  Google fonts, lazy React Router v6, TanStack Query + Zustand + Zod.
- **Design system:** `src/components/naqsha/*` (CornerTicks, SheetRef, Chip,
  StatTile, DataRow, BrandMark, DeviceFrame, EmptyState, ErrorState, RouteFallback);
  `src/components/ui/*` (Button, Input, Textarea, Select — token-styled, not shadcn CLI);
  `src/components/layouts/*` (Waiter/Kds/Manager/Owner/Phone shells + NavRail).
  Feature components: `table/TableCard`, `kot/KotCard`+`KotTimer`, `bill/BillLine`+`BatchMarker`+`SplitStepper`.
- **Data layer:** `types/domain.ts` (truth) · `types/api.ts` (Zod) · `lib/mocks/*` ·
  `lib/api/*` · `lib/realtime/socket.ts` (8s KOT tick stub) · `lib/format.ts` ·
  `hooks/*` · `stores/cart.ts` + `stores/session.ts`.
- **Screens:** all 11 at the routes in INTEGRATION.md; `/dev/components` gallery.
- **Backend switch (added):** `.env.example`, `src/vite-env.d.ts` (env types),
  `src/lib/api/http.ts` (`httpGet/httpPost`, `USE_MOCKS`, `API_BASE`),
  `src/lib/api/endpoints.ts` (path registry). Every read endpoint flips
  mock↔http on `VITE_USE_MOCKS`. Mocks are the default.

## Docs

- `README.md` — run/build, tokens, mock→real overview.
- `INTEGRATION.md` — **the** backend guide: env setup, data-flow hierarchy, full
  endpoint list (read wired + write pending), response shapes, realtime, deploy.
- `naqsha-frontend-handover.md` / `naqsha-mockups.html` — original spec (in repo).

## What is NOT done (candidate next tasks)

1. **Write endpoints not wired to UI** (only `submitFeedback` is end-to-end).
   Buttons exist but are local: A-02 Submit order, K-01 Mark prepared/Collected,
   M-02 Dispatch/Escalate, M-03 Take payment, M-04 Send for approval, O-02
   Approve/Reject. Paths are in `endpoints.ts` §3; wiring pattern in INTEGRATION.md §5.
2. **Real socket** — replace `lib/realtime/socket.ts` internals (keep signature).
3. **Auth** — none by design; stub in `stores/session.ts`, add header in `http.ts → headers()`.
4. **Admin/config surfaces** — intentionally out of scope.
5. Optional: swap `components/ui/*` for shadcn-CLI Radix components if an
   accessible popover Select is wanted (native `<select>` used today).

## Key decisions (don't relitigate)

- Tailwind v3 config-based tokens (not v4). Hand-written token-styled primitives
  instead of shadcn CLI (no network, avoids default violet/slate).
- One `TableCard` with `variant='waiter'|'manager'` covers all 8 table states.
- KDS palette-swap by `:station` lives in `KotCard` (`STATION_ACCENT`, un-exported
  to satisfy react-refresh lint).
- Domain types are ground truth; `lib/api/*` is the only swap point. Client-side
  sort for aggregate readiness is intentional and harmless.
- No default exports except route components; no barrel files; no `any`;
  `noUncheckedIndexedAccess` on.

## Environment gotchas (this machine)

- **pnpm 11:** esbuild build approval + `verifyDepsBeforeRun` config lives in
  `pnpm-workspace.yaml` (NOT package.json `pnpm` field). Already set.
- **No Chrome extension connected.** Verify visually with headless Chrome:
  `google-chrome-stable --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=W,H --virtual-time-budget=4500 --screenshot=out.png http://localhost:5173<route>` then Read the PNG at the device size.
- Commits: conventional, one screen/primitive each, co-author trailer
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`, push to origin/main.

## Resume checklist

1. `pnpm install` (allow-builds already in `pnpm-workspace.yaml`), `pnpm dev`.
2. Read `INTEGRATION.md` for the endpoint contract; `git log --oneline` for history.
3. Pick a task from "What is NOT done". For write endpoints, follow INTEGRATION.md §5.
4. Keep `pnpm typecheck` + `pnpm lint` green; verify screens with headless Chrome.
