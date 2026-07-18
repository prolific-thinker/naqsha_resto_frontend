import type { Role, SessionIdentity } from '@/types/domain';
import { identityFor } from '@/stores/session';

/** Stub session identity for a role (no auth — handover §11). */
export function useSessionMeta(role: Role): SessionIdentity {
  return identityFor(role);
}
