import { useState } from 'react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { Tabs } from '@/components/naqsha/Tabs';
import { Chip } from '@/components/naqsha/Chip';
import { DataRow } from '@/components/naqsha/DataRow';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PreviewBadge } from '@/components/naqsha/PreviewBadge';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useMenuAdminItems, useCombos, useTimedMenus } from '@/hooks/useErp';
import type { MenuAdminItem } from '@/types/erp';

const TABS = [
  { key: 'items', code: 'N-1', label: 'Items & prices' },
  { key: 'combos', code: 'N-3', label: 'Combos & deals' },
  { key: 'timed', code: 'N-4', label: 'Time-based menus' },
];

const STATION_LABEL: Record<string, string> = { drinks: 'Drinks', main: 'Main', bbq: 'BBQ' };

function foodCost(item: MenuAdminItem): string {
  if (!item.cost || !item.price) return '—';
  return `${Math.round((item.cost / item.price) * 100)}%`;
}

function ItemsTab() {
  const { data, isLoading, isError, refetch } = useMenuAdminItems();
  const [q, setQ] = useState('');
  if (isError) return <ErrorState label="menu items" onRetry={() => void refetch()} />;
  if (isLoading) return <ListSkeleton />;
  const items = (data ?? []).filter(
    (i) => i.name.toLowerCase().includes(q.toLowerCase()) || i.code.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="max-w-xs flex-1">
          <Input placeholder="Search item or code" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="primary" size="sm">
          + New item
        </Button>
      </div>
      <DataRow header cols="120px 1fr 90px 100px 90px 90px 120px">
        <span>Code</span>
        <span>Item</span>
        <span>Station</span>
        <span className="text-right">Price</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Food %</span>
        <span className="text-right">Availability</span>
      </DataRow>
      {items.length === 0 ? (
        <EmptyState className="mt-4" message="No items match your search." />
      ) : (
        items.map((it) => (
          <DataRow key={it.code} cols="120px 1fr 90px 100px 90px 90px 120px">
            <span className="font-mono text-[11px] text-muted">{it.code}</span>
            <span className="font-medium text-ink">{it.name}</span>
            <span className="text-muted">{STATION_LABEL[it.station] ?? it.station.toUpperCase()}</span>
            <span className="text-right font-mono font-semibold">₨ {money(it.price)}</span>
            <span className="text-right font-mono text-muted">{it.cost ? money(it.cost) : '—'}</span>
            <span className="text-right font-mono text-muted">{foodCost(it)}</span>
            <span className="flex justify-end">
              {it.is86 ? (
                <Chip variant="alert" className="cursor-pointer" >86 · off</Chip>
              ) : (
                <Chip variant="success" className="cursor-pointer">available</Chip>
              )}
            </span>
          </DataRow>
        ))
      )}
      <p className="mt-3 font-mono text-[10px] uppercase tracking-ref text-muted">
        N-2 · tap availability to 86 an item (writes Item.is_86)
      </p>
    </div>
  );
}

function CombosTab() {
  const { data, isLoading, isError, refetch } = useCombos();
  if (isError) return <ErrorState label="combos" onRetry={() => void refetch()} />;
  if (isLoading) return <ListSkeleton />;
  const combos = data ?? [];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {combos.map((c) => (
        <div key={c.code} className="relative rounded-md border border-line bg-paper-2 p-5">
          <CornerTicks />
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-ref text-muted">{c.code}</div>
              <h4 className="mt-1 font-display text-base font-semibold text-ink">{c.name}</h4>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-bold text-ink">₨ {money(c.price)}</div>
              {c.savingLabel && <div className="font-mono text-[10px] text-success">{c.savingLabel}</div>}
            </div>
          </div>
          <ul className="mt-3 space-y-1">
            {c.components.map((comp, i) => (
              <li key={i} className="flex justify-between text-[12.5px] text-muted">
                <span>{comp.name}</span>
                <span className="font-mono">×{comp.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button className="grid min-h-[140px] place-items-center rounded-md border border-dashed border-line-strong text-sm text-muted hover:border-teal hover:text-ink">
        + Build a combo (Product Bundle)
      </button>
    </div>
  );
}

function TimedTab() {
  const { data, isLoading, isError, refetch } = useTimedMenus();
  if (isError) return <ErrorState label="time-based menus" onRetry={() => void refetch()} />;
  if (isLoading) return <ListSkeleton />;
  return (
    <div className="flex flex-col gap-3">
      {(data ?? []).map((m) => (
        <div key={m.id} className="relative flex items-center justify-between rounded-md border border-line bg-paper-2 px-5 py-4">
          <CornerTicks />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-sm font-semibold text-ink">{m.name}</h4>
              <Chip variant={m.active ? 'success' : 'muted'}>{m.active ? 'active' : 'off'}</Chip>
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted">{m.windowLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-ink">{m.priceListLabel}</div>
            <div className="font-mono text-[11px] text-muted">{m.itemsCount} items</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded bg-paper-3" />
      ))}
    </div>
  );
}

export default function ManagerMenu() {
  const [tab, setTab] = useState('items');
  return (
    <ManagerShell
      title="Menu administration"
      refCode="N-01"
      right={<><PreviewBadge /><Button variant="ghost" size="sm">Price lists</Button></>}
    >
      <div className="border-b border-line bg-paper-2 px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="border-b-0" />
      </div>
      <div className={cn('flex-1 overflow-y-auto px-6 py-6')}>
        {tab === 'items' && <ItemsTab />}
        {tab === 'combos' && <CombosTab />}
        {tab === 'timed' && <TimedTab />}
      </div>
    </ManagerShell>
  );
}
