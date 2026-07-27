/**
 * Server → view-model adapters.
 *
 * The SPA's Zod schemas in src/types/api.ts are *view models*: they carry display
 * labels, chip tones and formatted durations. The server's contract
 * (src/types/server.ts) is raw camelCase data. These adapters are the seam.
 *
 * Rules:
 *  - pure and synchronous; context the payload lacks arrives as an argument
 *  - every optional mapping goes through `opt()` — Frappe sends null, Zod wants undefined
 *  - one file per API module, `to<DomainType>` naming
 */
export * from './shared';
export * from './floor';
export * from './menu';
export * from './kds';
export * from './billing';
export * from './inventory';
export * from './purchasing';
export * from './crm';
export * from './reports';
export * from './staff';
