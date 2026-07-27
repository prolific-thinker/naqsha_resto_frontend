import { useState } from 'react';
import { BrandMark } from '@/components/naqsha/BrandMark';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROLE_HOME, useSessionStore } from '@/stores/session';
import { rolesForPath } from '@/components/layouts/navConfig';

/**
 * Food-doodle wallpaper — a WhatsApp-style tiled line-art pattern of café items
 * behind a warm wash. Pure decoration; sits under the sign-in card.
 */
function FoodDoodleBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-teal"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="foodDoodles" width="150" height="150" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
            {/* coffee cup */}
            <g transform="translate(14,18)">
              <path d="M2 10 h20 v8 a8 8 0 0 1 -8 8 h-4 a8 8 0 0 1 -8 -8 z" />
              <path d="M22 12 h4 a4 4 0 0 1 0 8 h-4" />
              <path d="M6 3 q2 3 0 6 M12 3 q2 3 0 6 M18 3 q2 3 0 6" />
            </g>
            {/* fork & knife */}
            <g transform="translate(96,20)">
              <path d="M4 2 v10 M8 2 v10 M6 12 v18 M4 2 v6 M8 2 v6" />
              <path d="M20 2 c4 0 4 8 0 12 v16" />
            </g>
            {/* mint leaf */}
            <g transform="translate(20,96)">
              <path d="M2 26 C2 10 16 2 26 2 C26 18 14 26 2 26 Z" />
              <path d="M2 26 C8 20 16 14 22 10" />
            </g>
            {/* croissant */}
            <g transform="translate(92,100)">
              <path d="M2 20 C10 4 28 4 34 20 C26 14 10 14 2 20 Z" />
              <path d="M2 20 l-4 6 M34 20 l4 6" />
            </g>
            {/* chai glass */}
            <g transform="translate(60,58)">
              <path d="M4 4 h14 l-2 20 h-10 z" />
              <path d="M6 12 h10" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#foodDoodles)" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useSessionStore((s) => s.login);
  const error = useSessionStore((s) => s.error);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !busy;

  /** Where RequireAuth bounced us from, if the role is allowed to go back there. */
  const from = (location.state as { from?: string } | null)?.from;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      // The role comes from the server's primaryRole, never from the username.
      const user = await login(username.trim(), password);
      const allowed = from ? rolesForPath(from) : null;
      const target = from && (!allowed || allowed.includes(user.role)) ? from : ROLE_HOME[user.role];
      navigate(target, { replace: true });
    } catch {
      // The store holds the server's message; the form renders it below.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-teal-3 px-4">
      <FoodDoodleBackdrop />
      {/* Warm wash so the card reads clearly over the doodles */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/40 via-paper/10 to-paper/50" />

      <form
        onSubmit={signIn}
        className="relative w-full max-w-sm rounded-lg border border-line bg-paper-2 p-8 shadow-[0_20px_60px_-24px_rgba(34,30,26,0.45)]"
      >
        <BrandMark />
        <h1 className="mt-6 font-display text-[26px] font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-[13.5px] text-muted">Sign in to your restaurant workspace.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-username" className="text-[13px] font-medium text-ink">
              Username
            </label>
            <Input
              id="login-username"
              className="mt-1.5"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-[13px] font-medium text-ink">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              className="mt-1.5"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded border border-alert/40 bg-alert/10 px-3 py-2 text-[13px] text-alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={!canSubmit}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
