/** Additional-order divider between bill batches (mockup `.batch-marker`). */
export function BatchMarker({ label }: { label: string }) {
  return (
    <div className="my-2 inline-flex items-center gap-1 rounded-sm bg-saffron-2 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-ref text-amber">
      + ADD · {label}
    </div>
  );
}
