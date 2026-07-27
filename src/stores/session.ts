import { create } from 'zustand';
import { apiGet, apiPost, registerUnauthorizedHandler, setCsrfToken } from '@/lib/api/http';
import { METHODS } from '@/lib/api/endpoints';
import type { Role, SessionIdentity } from '@/types/domain';
import type { SrvSession } from '@/types/server';

/**
 * Real Frappe session.
 *
 * Nothing is persisted. The `sid` cookie IS the session; a localStorage copy of it
 * is exactly how you get a UI that believes it is signed in against a session the
 * server has already forgotten. Cold boot re-derives everything from
 * `naqsha_pos.api.auth.session`.
 *
 * `csrfToken` is not kept here either — it lives in http.ts module state. It is
 * transport plumbing, no component should re-render on it, and it rotates on login.
 */

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

export type AuthUser = {
  user: string;
  fullName: string;
  employee: string | null;
  roles: string[];
  /** primaryRole from the server: owner > manager > kitchen > waiter. */
  role: Role;
  branch: string | null;
  branchAbbr: string | null;
  canAccessDesk: boolean;
};

type SessionState = {
  status: SessionStatus;
  user: AuthUser | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (usr: string, pwd: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  handleUnauthorized: () => void;
};

function toAuthUser(s: SrvSession): AuthUser | null {
  // A user holding none of the four Naqsha roles has no home screen to land on.
  if (!s.primaryRole) return null;
  return {
    user: s.user,
    fullName: s.fullName,
    employee: s.employee,
    roles: s.roles ?? [],
    role: s.primaryRole,
    branch: s.branch,
    branchAbbr: s.branchAbbr,
    canAccessDesk: s.canAccessDesk,
  };
}

/** Called on logout and on a confirmed-dead session. Kept out of the store body so
 *  both paths tear down identically. */
let clearQueryCache: (() => void) | null = null;
let disconnectRealtime: (() => void) | null = null;

export function registerSessionTeardown(opts: { clearQueries?: () => void; disconnect?: () => void }): void {
  if (opts.clearQueries) clearQueryCache = opts.clearQueries;
  if (opts.disconnect) disconnectRealtime = opts.disconnect;
}

function teardown(): void {
  setCsrfToken(null);
  clearQueryCache?.();
  disconnectRealtime?.();
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'unknown',
  user: null,
  error: null,

  async bootstrap() {
    try {
      // authScope 'guest': a 403 here is the expected logged-out answer, not a
      // reason to trigger the force-logout path.
      const raw = await apiGet<SrvSession>(METHODS.session, { authScope: 'guest' });
      setCsrfToken(raw.csrfToken ?? null);
      const user = toAuthUser(raw);
      if (!user) {
        set({ status: 'anonymous', user: null, error: 'Your account has no Naqsha role.' });
        return;
      }
      set({ status: 'authenticated', user, error: null });
    } catch {
      set({ status: 'anonymous', user: null, error: null });
    }
  },

  async login(usr, pwd) {
    set({ error: null });
    try {
      // Frappe exempts /api/method/login from CSRF, and the token rotates on a
      // successful login — so fetching one beforehand would be wasted.
      await apiPost(METHODS.login, { usr, pwd }, { authScope: 'guest' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.';
      set({ status: 'anonymous', user: null, error: message });
      throw err;
    }

    const raw = await apiGet<SrvSession>(METHODS.session, { authScope: 'guest' });
    setCsrfToken(raw.csrfToken ?? null);

    const user = toAuthUser(raw);
    if (!user) {
      const message = 'Your account has no Naqsha role. Ask an owner to assign one.';
      set({ status: 'anonymous', user: null, error: message });
      throw new Error(message);
    }

    // No previous user's data may survive a sign-in.
    clearQueryCache?.();
    set({ status: 'authenticated', user, error: null });
    return user;
  },

  async logout() {
    try {
      await apiPost(METHODS.logout, {}, { authScope: 'guest' });
    } catch {
      // A failed logout call still means this browser is done with the session.
    }
    teardown();
    set({ status: 'anonymous', user: null, error: null });
  },

  handleUnauthorized() {
    teardown();
    set({
      status: 'anonymous',
      user: null,
      error: 'Your session ended. Please sign in again.',
    });
  },
}));

// http.ts calls this after it has PROVEN the session is dead (see its 403 probe),
// never on a bare 403 — an in-session permission error must not sign anyone out.
registerUnauthorizedHandler(() => useSessionStore.getState().handleUnauthorized());

/** Home route for a role after login. */
export const ROLE_HOME: Record<Role, string> = {
  waiter: '/waiter/tables',
  manager: '/manager/floor',
  owner: '/owner/dashboard',
  kitchen: '/kds/main',
};

/**
 * Identity for the shell headers. Signature unchanged so the screens that call it
 * do not change; the `role` argument is now only a fallback for when there is no
 * session (the dev component gallery).
 */
export function identityFor(role: Role): SessionIdentity {
  const user = useSessionStore.getState().user;
  if (!user) return { role, branchLabel: '—' };

  return {
    role: user.role,
    waiter: user.employee ? { id: user.employee, name: user.fullName } : undefined,
    branchLabel: user.branchAbbr ? `${user.branchAbbr} · ${user.branch}` : (user.branch ?? '—'),
  };
}
