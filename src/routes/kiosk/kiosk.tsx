import { useMemo, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { BrandMark } from '@/components/naqsha/BrandMark';
import { Chip } from '@/components/naqsha/Chip';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { Button } from '@/components/ui/Button';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useGuestMenu } from '@/hooks/useGuestMenu';

type Cart = Record<string, number>;

export default function Kiosk() {
  // The kiosk is a guest surface with no session, so it reads guest.menu like the
  // QR page does. It has no table of its own — point VITE_KIOSK_TABLE_SLUG at a
  // dedicated 'Kiosk' Restaurant Table so orders land somewhere real.
  const slug = import.meta.env.VITE_KIOSK_TABLE_SLUG ?? '';
  const { data: menu, isLoading, isError, refetch } = useGuestMenu(slug);
  const cats = menu?.categories;
  const items = menu?.items;
  const [cart, setCart] = useState<Cart>({});
  const [activeCat, setActiveCat] = useState<string>('all');
  const [done, setDone] = useState(false);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const sub = (id: string) =>
    setCart((c) => {
      const n = (c[id] ?? 0) - 1;
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const byId = useMemo(() => new Map((items ?? []).map((i) => [i.id, i])), [items]);
  const lines = Object.entries(cart).map(([id, qty]) => ({ item: byId.get(id)!, qty })).filter((l) => l.item);
  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const shown = (items ?? []).filter((i) => activeCat === 'all' || i.categoryId === activeCat);

  if (done)
    return (
      <div className="grid h-screen place-items-center bg-ink text-paper">
        <div className="text-center">
          <div className="font-display text-6xl font-bold text-saffron">#{Math.floor(100 + Math.random() * 800)}</div>
          <h1 className="mt-4 font-display text-3xl font-bold">Order received</h1>
          <p className="mt-2 text-muted-2">Please collect your token and wait for your number. Paid ₨ {money(subtotal)}.</p>
          <Button variant="saffron" size="lg" className="mt-8" onClick={() => { setDone(false); setCart({}); }}>
            Start new order
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen flex-col bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line bg-paper-2 px-8 py-5">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="font-display text-lg font-semibold">Self-order kiosk</span>
        </div>
        <Chip variant="teal">Tap to order</Chip>
      </header>

      <div className="grid flex-1 grid-cols-[200px_1fr_360px] overflow-hidden">
        {/* Category rail */}
        <nav className="overflow-y-auto border-r border-line bg-paper-2 p-3">
          <CatBtn label="All items" on={activeCat === 'all'} onClick={() => setActiveCat('all')} />
          {(cats ?? []).map((c) => (
            <CatBtn key={c.id} label={c.name} on={activeCat === c.id} onClick={() => setActiveCat(c.id)} />
          ))}
        </nav>

        {/* Grid */}
        <main className="overflow-y-auto p-6">
          {isError ? (
            <ErrorState label="menu" onRetry={() => void refetch()} />
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded bg-paper-3" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {shown.map((it) => (
                <button
                  key={it.id}
                  disabled={it.outOfStock}
                  onClick={() => add(it.id)}
                  className={cn(
                    'relative flex flex-col rounded-md border border-line bg-paper-2 p-5 text-left transition hover:border-teal',
                    it.outOfStock && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <div className="font-display text-base font-semibold">{it.name}</div>
                  <div className="mt-1 flex-1 text-[13px] text-muted">{it.description}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-lg font-bold">₨ {money(it.price)}</span>
                    {it.outOfStock ? <Chip variant="alert">86</Chip> : (cart[it.id] ?? 0) > 0 ? <Chip variant="teal">{cart[it.id]} in cart</Chip> : <Plus size={20} className="text-teal" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Cart */}
        <aside className="flex flex-col border-l border-line bg-paper-2">
          <div className="border-b border-line px-6 py-4">
            <h2 className="font-display text-lg font-semibold">Your tray</h2>
            <p className="font-mono text-[11px] text-muted">{count} item{count !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {lines.length === 0 ? (
              <p className="mt-6 text-center text-[13px] text-muted">Tap items to add them here.</p>
            ) : (
              <ul className="space-y-3">
                {lines.map((l) => (
                  <li key={l.item.id} className="flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-display text-sm font-semibold">{l.item.name}</div>
                      <div className="font-mono text-[12px] text-muted">₨ {money(l.item.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => sub(l.item.id)} aria-label="remove" className="grid h-9 w-9 place-items-center rounded border border-line-strong"><Minus size={16} /></button>
                      <span className="w-6 text-center font-mono font-semibold">{l.qty}</span>
                      <button onClick={() => add(l.item.id)} aria-label="add" className="grid h-9 w-9 place-items-center rounded bg-teal text-paper"><Plus size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-line px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display text-2xl font-bold">₨ {money(subtotal)}</span>
            </div>
            <div className="flex gap-2">
              {count > 0 && (
                <Button variant="ghost" onClick={() => setCart({})} aria-label="clear tray">
                  <Trash2 size={16} />
                </Button>
              )}
              <Button variant="primary" size="lg" className="flex-1" disabled={count === 0} onClick={() => setDone(true)}>
                Pay &amp; place order
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CatBtn({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'mb-1 w-full rounded px-4 py-3 text-left font-display text-sm font-medium',
        on ? 'bg-teal text-paper' : 'text-muted hover:bg-paper-3 hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}
