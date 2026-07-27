import type { Role, SessionIdentity } from '@/types/domain';
import { identityFor, useSessionStore } from '@/stores/session';

/**
 * Shell identity for the current session.
 *
 * The `role` argument is kept for signature compatibility and is now only a fallback
 * for surfaces with no session (the dev component gallery). The real identity comes
 * from `naqsha_pos.api.auth.session`.
 */
export function useSessionMeta(role: Role): SessionIdentity {
  // Subscribe so the shell re-renders when the session lands after bootstrap.
  const user = useSessionStore((s) => s.user);
  void user;
  return identityFor(role);
}
