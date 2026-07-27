import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { WaiterShell } from '@/components/layouts/WaiterShell';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { cn } from '@/lib/utils';
import { money } from '@/lib/format';
import type { MenuItem, Station } from '@/types/domain';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { useSessionMeta } from '@/hooks/useSessionMeta';
import { cartCount, cartSubtotal, useCartStore } from '@/stores/cart';
import { ItemModifierSheet } from '@/components/order/ItemModifierSheet';
import { useSubmitOrder } from '@/hooks/useActions';
import { useWaiterTables } from '@/hooks/useOpenTables';
import { isFailure } from '@/lib/api/http';

const STATION_LABEL: Record<Station, string> = { drinks: 'DRINKS', main: 'MAIN', bbq: 'BBQ' };

export default function WaiterMenuCart() {
  const { tableId = 'T-02' } = useParams();
  const session = useSessionMeta('waiter');
  const { data: categories } = useMenuCategories();
  const { data: items, isError: itemsError, refetch: refetchItems } = useMenuItems();

  // Defaults to the first real category once the menu loads; the previous literal
  // ('cat-coffee') was a mock id and left the grid empty against a real backend.
  const [activeCat, setActiveCat] = useState<string>('');
  const [query, setQuery] = useState('');

  const lines = useCartStore((s) => s.lines);
  const seed = useCartStore((s) => s.seed);
  const setPax = useCartStore((s) => s.setPax);
  const addItem = useCartStore((s) => s.addItem);
  const setNote = useCartStore((s) => s.setNote);
  const storeTable = useCartStore((s) => s.tableRef);

  // FOH-2 / FOH-3 — item currently being customized (modifiers, course, seat).
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const navigate = useNavigate();
  const clear = useCartStore((s) => s.clear);
  const ensureOfflineRef = useCartStore((s) => s.ensureOfflineRef);
  const pax = useCartStore((s) => s.pax);
  const { data: tables } = useWaiterTables();
  const submitOrder = useSubmitOrder();

  const fire = async () => {
    if (!lines.length || submitOrder.isPending) return;
    setOrderError(null);
    // Minted once per cart, reused by every retry of this same tap.
    const offlineRef = ensureOfflineRef();
    // A table that already has an open order must APPEND, or submit_order would
    // create a second Sales Order and the bill would only follow one of them.
    const hasOpenOrder = Boolean(tables?.find((t) => t.ref === tableId)?.amount);
    const res = await submitOrder.mutateAsync({
      table: tableId, pax: pax ?? 0, lines, offlineRef, hasOpenOrder,
    });
    if (isFailure(res)) {
      setOrderError(res.message);
      return;
    }
    clear();
    navigate('/waiter/tables');
  };

  const confirmCustomize = (note: string) => {
    if (!customizing) return;
    addItem(customizing);
    if (note) setNote(customizing.id, note);
    setCustomizing(null);
  };

  // Start each table with an empty cart. (There was a hard-coded demo seed here;
  // its item ids do not exist on a real site, so every order built from it would
  // have failed with an unknown item code.)
  const tablePax = tables?.find((t) => t.ref === tableId)?.pax;

  // Seed the cart with the table's ACTUAL covers. This was `seed(tableId, 4, [])`, so
  // every order in the restaurant was submitted as a party of four regardless of who
  // was sitting there — which is the `pax` that lands on the Sales Invoice and drives
  // revenue-per-cover. Re-seeded once the table data arrives.
  useEffect(() => {
    if (storeTable !== tableId) seed(tableId, tablePax ?? 0, []);
    else if (tablePax && pax !== tablePax) setPax(tablePax);
  }, [storeTable, tableId, tablePax, pax, seed, setPax]);

  useEffect(() => {
    if (!activeCat && categories?.length) setActiveCat(categories[0]!.id);
  }, [activeCat, categories]);

  const activeCategory = categories?.find((c) => c.id === activeCat);
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((it) => {
      if (q) return it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q);
      return it.categoryId === activeCat;
    });
  }, [items, activeCat, query]);

  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);
  const avatar = session.waiter?.name.charAt(0) ?? 'W';

  return (
    <WaiterShell
      left={
        <span className="inline-flex items-center gap-2 rounded border border-[#B8D4D8] bg-teal-3 px-[9px] py-[3px] font-mono text-[11px] tracking-ref text-teal">
          <strong>{tableId}</strong>
          {tablePax ? ` · ${tablePax} pax` : ''} · {session.waiter?.name}
        </span>
      }
      right={
        <>
          <SheetRef tracking="ref">
            {count ? `${count} ${count === 1 ? 'item' : 'items'} · unsent` : 'no items yet'}
          </SheetRef>
          <div className="grid h-[30px] w-[30px] place-items-center rounded-full bg-teal font-display text-[13px] font-semibold text-paper">
            {avatar}
          </div>
        </>
      }
    >
      <div className="grid h-full grid-cols-[150px_1fr_240px] xl:grid-cols-[220px_1fr_320px]">
        {/* Category rail */}
        <div className="overflow-y-auto border-r border-line bg-paper-2 py-5">
          {(categories ?? []).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              className={cn(
                'flex w-full items-center justify-between border-l-[3px] px-5 py-3 text-left font-display text-[13px]',
                cat.id === activeCat
                  ? 'border-teal bg-paper font-semibold text-ink'
                  : 'border-transparent font-medium text-muted',
              )}
            >
              {cat.name}
              <span className="font-mono text-[11px] text-muted-2">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="overflow-y-auto bg-paper px-6 py-5">
          <div className="mb-5 flex items-center rounded-md border border-line bg-paper-2 px-3.5 py-2.5">
            <Search size={15} className="mr-2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu — item name, code, or ingredient"
              aria-label="Search menu"
              className="flex-1 border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-muted-2"
            />
            <SheetRef tracking="ref">{items?.length ?? 0} items</SheetRef>
          </div>

          <div className="mb-3 flex items-baseline justify-between">
            <div className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
              {query ? 'Search results' : (activeCategory?.name ?? '')}
            </div>
            {activeCategory && !query && (
              <SheetRef tracking="ref">→ station: {activeCategory.station}</SheetRef>
            )}
          </div>

          {itemsError ? (
            <ErrorState label="the menu" onRetry={() => void refetchItems()} />
          ) : visibleItems.length === 0 ? (
            <EmptyState message={query ? `No items match “${query}”.` : 'No items in this category.'} />
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onAdd={() => addItem(item)}
                  onCustomize={() => setCustomizing(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <aside className="flex flex-col bg-ink text-paper">
          <div className="border-b border-ink-3 px-5 pb-3 pt-5">
            <span className="inline-flex items-center gap-2 rounded bg-ink-3 px-2.5 py-1 font-mono text-[11px] tracking-ref">
              <strong>{tableId}</strong>
          {tablePax ? ` · ${tablePax} pax` : ''} · {session.waiter?.name}
            </span>
            <h3 className="mt-2.5 font-display text-lg font-semibold tracking-[-0.01em]">
              Current order
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3">
            {lines.map((line) => (
              <div
                key={line.itemId}
                className="grid grid-cols-[30px_1fr_auto] items-center gap-2.5 border-b border-ink-3 py-2.5"
              >
                <span className="font-mono font-semibold text-saffron">{line.qty}×</span>
                <span className="text-[13px]">
                  {line.name}{' '}
                  <span className="font-mono text-[10px] uppercase tracking-ref text-muted-2">
                    → {STATION_LABEL[line.station] ?? line.station.toUpperCase()}
                  </span>
                  {line.note && (
                    <span className="mt-0.5 block text-[10px] italic text-saffron">
                      note: {line.note}
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs">{money(line.qty * line.price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-ink-3 bg-ink-2 px-5 py-4">
            <div className="mb-2 flex justify-between text-xs text-line-2">
              <span>Subtotal ({count} items)</span>
              <span className="font-mono">{money(subtotal)}</span>
            </div>
            <div className="mb-2 flex justify-between text-xs text-line-2">
              <span>Service (0%)</span>
              <span className="font-mono">—</span>
            </div>
            <div className="mb-4 mt-2 flex items-center justify-between font-display text-[22px] font-bold tracking-[-0.01em]">
              <span>Total</span>
              <span className="font-mono text-saffron">₨ {money(subtotal)}</span>
            </div>
            {orderError && (
              <p role="alert" className="mb-2 rounded border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
                {orderError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => clear()}
                className="flex items-center justify-center rounded border border-ink-3 bg-ink-3 px-4 py-2.5 font-body text-[13px] font-semibold text-paper"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => void fire()}
                disabled={!lines.length || submitOrder.isPending}
                className="flex items-center justify-center rounded bg-saffron px-4 py-2.5 font-body text-[13px] font-semibold text-ink disabled:opacity-50"
              >
                {submitOrder.isPending ? 'Firing…' : 'Submit order'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {customizing && (
        <ItemModifierSheet
          item={customizing}
          onCancel={() => setCustomizing(null)}
          onConfirm={confirmCustomize}
        />
      )}
    </WaiterShell>
  );
}

function MenuCard({ item, onAdd, onCustomize }: { item: MenuItem; onAdd: () => void; onCustomize: () => void }) {
  return (
    <div
      className={cn(
        'relative rounded-md border border-line bg-paper-2 p-3.5',
        item.outOfStock ? 'opacity-50' : 'hover:border-teal',
      )}
    >
      <div className="text-[13.5px] font-semibold text-ink">{item.name}</div>
      <div
        className={cn(
          'mt-1 h-[26px] overflow-hidden text-[11px]',
          item.outOfStock ? 'text-alert' : 'text-muted',
        )}
      >
        {item.outOfStock ? item.outOfStockReason : item.description}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-mono text-[13px] font-semibold text-ink">₨ {money(item.price)}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCustomize}
            disabled={item.outOfStock}
            aria-label={`Customize ${item.name}`}
            title="Modifiers, course & seat"
            className={cn(
              'grid h-7 w-7 place-items-center rounded border border-line-strong text-muted',
              item.outOfStock ? 'cursor-not-allowed opacity-50' : 'hover:border-teal hover:text-teal',
            )}
          >
            <SlidersHorizontal size={13} />
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={item.outOfStock}
            aria-label={`Add ${item.name}`}
            className={cn(
              'grid h-7 w-7 place-items-center rounded font-display text-base font-semibold text-paper',
              item.outOfStock ? 'cursor-not-allowed bg-muted-2' : 'bg-teal',
            )}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
