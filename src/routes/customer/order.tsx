import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Gift } from 'lucide-react';
import { PhoneShell } from '@/components/layouts/PhoneShell';
import { BrandMark } from '@/components/naqsha/BrandMark';
import { Chip } from '@/components/naqsha/Chip';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useGuestMenu } from '@/hooks/useGuestMenu';
import { guestPlaceOrder } from '@/lib/api/mutations';
import { isFailure } from '@/lib/api/http';
import { makeRef } from '@/lib/idempotency';
import { PROGRAM_NAME, pointsFor, useLoyaltyStore } from '@/stores/loyalty';
import type { MenuItem } from '@/types/domain';

type Cart = Record<string, number>;

export default function CustomerOrder() {
  const { tableSlug = '' } = useParams();
  // guest.menu, not menu.items: the staff endpoint needs a session, and this page
  // has none by design.
  const { data: menu, isLoading, isError, refetch } = useGuestMenu(tableSlug);
  const cats = menu?.categories;
  const items = menu?.items;
  const recordOrder = useLoyaltyStore((s) => s.recordOrder);
  const [cart, setCart] = useState<Cart>({});
  const [phone, setPhone] = useState('');
  const [placed, setPlaced] = useState(false);
  const [earned, setEarned] = useState(0);
  const [sending, setSending] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  // One key per visit to this page, reused by every retry of the same tap.
  const [offlineRef] = useState(() => makeRef('gso'));

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

  const placeOrder = async () => {
    if (!lines.length || sending) return;
    setSending(true);
    setOrderError(null);
    try {
      const res = await guestPlaceOrder({
        slug: tableSlug,
        items: lines.map((l) => ({ code: l.item.id, qty: l.qty })),
        phone: phone.replace(/\D/g, '').length >= 7 ? phone.trim() : undefined,
        offlineRef,
      });
      if (isFailure(res)) {
        // ITEM_86 / TABLE_NOT_OPEN / TOO_MANY_ORDERS are written for guests to read.
        setOrderError(res.message);
        return;
      }
      setEta(res.eta);
      if (phone.replace(/\D/g, '').length >= 7) {
        const r = recordOrder({ name: 'Cafe guest', phone: phone.trim() }, subtotal, 'cafe');
        setEarned(r.earned);
      }
      setPlaced(true);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Could not send your order.');
    } finally {
      setSending(false);
    }
  };

  if (isError)
    return (
      <PhoneShell>
        <ErrorState label="menu" onRetry={() => void refetch()} />
      </PhoneShell>
    );

  if (placed)
    return (
      <PhoneShell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-success-2 text-success">
            <ShoppingBag size={28} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">Order placed!</h2>
          <p className="mt-2 text-sm text-muted">
            Your order is with the kitchen{eta ? ` · about ${Math.ceil(eta / 60)} min` : ''}. Total ₨ {money(subtotal)}.
          </p>
          {earned > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded border border-[#E9C79B] bg-amber-2 px-3 py-2 text-[13px] text-amber">
              <Gift size={16} /> +{earned} {PROGRAM_NAME} points earned
            </div>
          )}
          <Button variant="ghost" className="mt-6" onClick={() => { setPlaced(false); setCart({}); setPhone(''); setEarned(0); }}>
            Order more
          </Button>
        </div>
      </PhoneShell>
    );

  const grouped = (cats ?? []).map((c) => ({
    cat: c,
    items: (items ?? []).filter((i) => i.categoryId === c.id),
  }));

  return (
    <PhoneShell className="pb-28">
      <header className="mb-5 flex items-center justify-between">
        <BrandMark />
        <Chip variant="teal">Table {tableSlug}</Chip>
      </header>
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-ref text-muted">Scan · order · pay</div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.01em] text-ink">Order from your table</h1>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-paper-3" />
          ))}
        </div>
      ) : (
        grouped.map(({ cat, items: list }) =>
          list.length === 0 ? null : (
            <section key={cat.id} className="mb-6">
              <h3 className="mb-2 font-mono text-[11px] uppercase tracking-code text-saffron">{cat.name}</h3>
              <div className="space-y-2">
                {list.map((it) => (
                  <MenuRow key={it.id} item={it} qty={cart[it.id] ?? 0} onAdd={() => add(it.id)} onSub={() => sub(it.id)} />
                ))}
              </div>
            </section>
          ),
        )
      )}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[420px] border-t border-line bg-paper-2 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <Gift size={15} className="shrink-0 text-saffron" />
            <Input
              type="tel"
              inputMode="tel"
              placeholder="Phone for rewards (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Phone number for loyalty rewards"
            />
          </div>
          {orderError && (
            <p role="alert" className="mb-2 rounded border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
              {orderError}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={sending}
            onClick={() => void placeOrder()}
          >
            <span className="flex w-full items-center justify-between">
              <span>{sending ? 'Sending…' : `${count} item${count > 1 ? 's' : ''} · send to kitchen`}</span>
              <span className="font-mono">₨ {money(subtotal)}</span>
            </span>
          </Button>
          <p className="mt-1.5 text-center font-mono text-[10px] text-muted">
            {phone.replace(/\D/g, '').length >= 7 ? `earns ${pointsFor(subtotal)} points · ` : ''}prices are set by the kitchen
          </p>
        </div>
      )}
    </PhoneShell>
  );
}

function MenuRow({ item, qty, onAdd, onSub }: { item: MenuItem; qty: number; onAdd: () => void; onSub: () => void }) {
  const off = item.outOfStock;
  return (
    <div className={cn('flex items-center justify-between rounded-md border border-line bg-paper px-4 py-3', off && 'opacity-60')}>
      <div className="min-w-0 flex-1 pr-3">
        <div className="font-display text-sm font-semibold text-ink">{item.name}</div>
        <div className="truncate text-[12px] text-muted">{item.description}</div>
        <div className="mt-0.5 font-mono text-[12px] font-semibold text-ink">₨ {money(item.price)}</div>
      </div>
      {off ? (
        <Chip variant="alert">86</Chip>
      ) : qty > 0 ? (
        <div className="flex items-center gap-2">
          <button type="button" onClick={onSub} aria-label="remove one" className="grid h-8 w-8 place-items-center rounded border border-line-strong text-ink">
            <Minus size={14} />
          </button>
          <span className="w-5 text-center font-mono font-semibold">{qty}</span>
          <button type="button" onClick={onAdd} aria-label="add one" className="grid h-8 w-8 place-items-center rounded bg-teal text-paper">
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={onAdd} className="grid h-8 w-8 place-items-center rounded bg-teal text-paper" aria-label={`add ${item.name}`}>
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}
