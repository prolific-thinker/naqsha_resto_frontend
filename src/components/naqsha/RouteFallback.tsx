/** Suspense fallback shown while a lazy route chunk loads. */
export function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-2">
      <div className="font-mono text-xs uppercase tracking-code text-muted-2">
        Loading…
      </div>
    </div>
  );
}
