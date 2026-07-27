import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { registerSessionTeardown, useSessionStore } from './stores/session';
import { BusinessError } from './lib/api/http';
import { disconnectSocket } from './lib/realtime/socket';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      // One retry is right for a flaky network but wrong for a permission error, so
      // never retry a 4xx — it just delays the error state by a round trip.
      //
      // A BusinessError is the same case wearing a 200: Frappe answers NO_OPEN_ORDER /
      // POS_NOT_OPEN / TABLE_NOT_FOUND with HTTP 200 and {ok:false}, so it carries no
      // `status` and used to fall through to the retry. Retrying cannot change a
      // deterministic answer, and the retry is worse than useless — TanStack's
      // `canContinue()` requires `focusManager.isFocused()`, so on a terminal that has
      // been switched away from, the retry PAUSES INDEFINITELY and the query never
      // reaches `isError`. The screen then sits on "Loading…" forever instead of
      // showing the server's own wording. See FRAPPE_GOTCHAS.md §35.
      retry: (failureCount, error) => {
        if (error instanceof BusinessError) return false;
        const status = (error as { status?: number } | null)?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// Signing in or out must not leave the previous session's data in the cache, and
// must not leave a socket authenticated as the previous user.
registerSessionTeardown({
  clearQueries: () => queryClient.clear(),
  disconnect: disconnectSocket,
});

// Re-derive the session from the sid cookie before the first render settles. Guarded
// inside the store so React 18 StrictMode's double-mount does not double-fetch.
void useSessionStore.getState().bootstrap();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
