import { create } from 'zustand';
import type { Role, SessionIdentity, Waiter } from '@/types/domain';

/**
 * Stub session — no auth yet (handover §11). Kiosks assume a hard-coded
 * identity per role; the real login flow will replace this store wholesale.
 */

const AHMED: Waiter = { id: 'W-04', name: 'Ahmed' };

const IDENTITIES: Record<Role, SessionIdentity> = {
  waiter: {
    role: 'waiter',
    waiter: AHMED,
    branchLabel: 'Cafe · Lahore branch',
    shiftLabel: 'Shift 18:00–02:00',
  },
  manager: {
    role: 'manager',
    branchLabel: 'Cafe · Lahore branch',
    sessionRef: 'S-2026-198',
  },
  owner: {
    role: 'owner',
    branchLabel: 'Cafe · Lahore branch',
  },
  kitchen: {
    role: 'kitchen',
    branchLabel: 'Cafe · Lahore branch',
  },
};

type SessionState = {
  identities: Record<Role, SessionIdentity>;
};

export const useSessionStore = create<SessionState>(() => ({
  identities: IDENTITIES,
}));

export function identityFor(role: Role): SessionIdentity {
  return IDENTITIES[role];
}
