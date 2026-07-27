import { useState } from 'react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { Tabs } from '@/components/naqsha/Tabs';
import { Chip, type ChipVariant } from '@/components/naqsha/Chip';
import { DataRow } from '@/components/naqsha/DataRow';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { FormDialog, Field } from '@/components/naqsha/FormDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { money } from '@/lib/format';
import {
  usePurchaseOrders,
  useSuppliers,
  useStockLevels,
  useCreatePurchaseOrder,
  useCreateSupplier,
  useReceivePurchaseOrder,
} from '@/hooks/useErp';
import { isFailure } from '@/lib/api/http';
import type { PoStatus } from '@/types/erp';

const TABS = [
  { key: 'orders', code: 'I-4', label: 'Purchase orders' },
  { key: 'suppliers', code: 'I-5', label: 'Suppliers' },
];

const PO_CHIP: Record<PoStatus, ChipVariant> = {
  draft: 'muted',
  to_receive: 'amber',
  completed: 'success',
  cancelled: 'alert',
};

// ---------------------------------------------------------------------------
// I-4 · Purchase orders
// ---------------------------------------------------------------------------

function OrdersTab() {
  const { data, isLoading, isError, refetch } = usePurchaseOrders();
  const receive = useReceivePurchaseOrder();
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (isError) return <ErrorState label="purchase orders" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const orders = data ?? [];

  const onReceive = (ref: string) => {
    setFailure(null);
    receive.mutate(ref, {
      onSuccess: (res) => {
        if (isFailure(res)) setFailure(`${ref}: ${res.message}`);
      },
      onError: (err) => setFailure(err instanceof Error ? err.message : 'Could not post the receipt.'),
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] text-alert">{failure ?? ''}</span>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          + New purchase order
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="No purchase orders yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((po) => {
            const isOpen = open === po.ref;
            return (
              <div key={po.ref} className="relative rounded-md border border-line bg-paper-2">
                <CornerTicks />
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : po.ref)}
                  aria-expanded={isOpen}
                  className="grid w-full items-center gap-4 px-5 py-4 text-left lg:grid-cols-[160px_1fr_130px_120px_110px]"
                >
                  <span className="font-mono text-[11px] text-muted">{po.ref}</span>
                  <span className="font-medium text-ink">{po.supplier}</span>
                  <span className="text-[12px] text-muted">{po.dateLabel}</span>
                  <span className="text-right font-mono font-semibold">₨ {money(po.total)}</span>
                  <span className="flex justify-end">
                    <Chip variant={PO_CHIP[po.status]}>{po.statusLabel}</Chip>
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-line px-5 py-3">
                    <DataRow header cols="1fr 90px 90px 110px">
                      <span>Item</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Rate</span>
                      <span className="text-right">Amount</span>
                    </DataRow>
                    {po.lines.map((l, i) => (
                      <DataRow key={i} cols="1fr 90px 90px 110px" className="py-2">
                        <span className="text-ink">{l.name}</span>
                        <span className="text-right font-mono text-muted">
                          {l.qty} {l.uom}
                        </span>
                        <span className="text-right font-mono text-muted">{money(l.rate)}</span>
                        <span className="text-right font-mono">{money(l.amount)}</span>
                      </DataRow>
                    ))}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-ref text-muted">
                        Schedule · {po.scheduleLabel}
                      </span>
                      {/* Only a submitted, not-yet-fully-received order can be received.
                          A draft has no stock commitment for a receipt to draw down. */}
                      {po.status === 'to_receive' && po.receivedPct < 100 && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={receive.isPending}
                          onClick={() => onReceive(po.ref)}
                        >
                          {receive.isPending ? 'Receiving…' : 'Receive stock'}
                        </Button>
                      )}
                      {po.status === 'draft' && (
                        <span className="font-mono text-[10px] text-muted">
                          submit in Desk before receiving
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {creating && <NewOrderDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

type Line = { code: string; qty: string; rate: string };

function NewOrderDialog({ onClose }: { onClose: () => void }) {
  const { data: suppliers } = useSuppliers();
  const { data: stock } = useStockLevels();
  const create = useCreatePurchaseOrder();

  const [supplier, setSupplier] = useState('');
  const [lines, setLines] = useState<Line[]>([{ code: '', qty: '', rate: '' }]);
  const [error, setError] = useState<string | null>(null);

  const supplierOptions = (suppliers ?? []).map((s) => ({ value: s.id, label: s.name }));
  const itemOptions = (stock ?? []).map((s) => ({ value: s.code, label: `${s.name} (${s.uom})` }));

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (i === j ? { ...l, ...patch } : l)));

  /** Prefill the rate from the item's current valuation — it is the closest thing to
   *  a last-paid price the site has, and typing it again invites a typo. */
  const pickItem = (i: number, code: string) => {
    const row = (stock ?? []).find((s) => s.code === code);
    setLine(i, { code, rate: row ? String(row.valuationRate) : '' });
  };

  const submit = () => {
    setError(null);
    const chosen = lines.filter((l) => l.code && Number(l.qty) > 0);
    if (!supplier) return setError('Choose a supplier.');
    if (chosen.length === 0) return setError('Add at least one line with a quantity.');

    create.mutate(
      {
        supplier,
        items: chosen.map((l) => ({ code: l.code, qty: Number(l.qty), rate: Number(l.rate) || 0 })),
      },
      {
        onSuccess: (res) => (isFailure(res) ? setError(res.message) : onClose()),
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not raise the order.'),
      },
    );
  };

  return (
    <FormDialog
      title="New purchase order"
      refCode="I-4 · Purchase Order"
      submitLabel="Raise order"
      onSubmit={submit}
      onClose={onClose}
      busy={create.isPending}
      error={error}
    >
      <Field label="Supplier">
        <Select
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          options={supplierOptions}
          placeholder="Choose a supplier"
        />
      </Field>

      <div>
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-ref text-muted">Lines</span>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_90px] gap-2">
              <Select value={l.code} onChange={(e) => pickItem(i, e.target.value)} options={itemOptions} placeholder="Item" />
              <Input type="number" min="0" step="0.01" placeholder="Qty" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
              <Input type="number" min="0" step="0.01" placeholder="Rate" value={l.rate} onChange={(e) => setLine(i, { rate: e.target.value })} />
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setLines((ls) => [...ls, { code: '', qty: '', rate: '' }])}
        >
          + Add line
        </Button>
      </div>

      <p className="font-mono text-[10px] text-muted">
        Submitted on save. Delivery is scheduled two days out; change it in Desk if the
        supplier commits to another date.
      </p>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------
// I-5 · Suppliers
// ---------------------------------------------------------------------------

function SuppliersTab() {
  const { data, isLoading, isError, refetch } = useSuppliers();
  const [creating, setCreating] = useState(false);

  if (isError) return <ErrorState label="suppliers" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];
  const owed = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-ref text-muted">
          {owed > 0 ? `₨ ${money(owed)} outstanding across ${rows.length} suppliers` : 'nothing outstanding'}
        </span>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          + New supplier
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No suppliers yet." />
      ) : (
        <>
          <DataRow header cols="1fr 130px 160px 110px 130px">
            <span>Supplier</span>
            <span>Group</span>
            <span>Phone</span>
            <span>City</span>
            <span className="text-right">Outstanding</span>
          </DataRow>
          {rows.map((s) => (
            <DataRow key={s.id} cols="1fr 130px 160px 110px 130px">
              <span className="font-medium text-ink">{s.name}</span>
              <span className="text-muted">{s.group}</span>
              <span className="font-mono text-[12px] text-muted">{s.phone || '—'}</span>
              <span className="text-muted">{s.city ?? '—'}</span>
              <span
                className={
                  s.outstanding > 0
                    ? 'text-right font-mono font-semibold text-alert'
                    : 'text-right font-mono text-muted'
                }
              >
                {s.outstanding > 0 ? `₨ ${money(s.outstanding)}` : 'clear'}
              </span>
            </DataRow>
          ))}
        </>
      )}

      {creating && <NewSupplierDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function NewSupplierDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateSupplier();
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Raw Material');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!name.trim()) return setError('A supplier name is required.');
    create.mutate(
      { name: name.trim(), group, phone: phone || undefined, city: city || undefined },
      {
        onSuccess: (res) => (isFailure(res) ? setError(res.message) : onClose()),
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not save the supplier.'),
      },
    );
  };

  return (
    <FormDialog
      title="New supplier"
      refCode="I-5 · Supplier"
      submitLabel="Save supplier"
      onSubmit={submit}
      onClose={onClose}
      busy={create.isPending}
      error={error}
    >
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Al-Barkat Poultry" />
      </Field>
      <Field label="Group">
        <Select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          options={[
            { value: 'Raw Material', label: 'Raw Material' },
            { value: 'Local', label: 'Local' },
            { value: 'Distributor', label: 'Distributor' },
            { value: 'Services', label: 'Services' },
          ]}
        />
      </Field>
      <Field label="Phone" hint="optional">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" />
      </Field>
      <Field label="City" hint="optional">
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lahore" />
      </Field>
    </FormDialog>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded bg-paper-3" />
      ))}
    </div>
  );
}

export default function ManagerPurchasing() {
  const [tab, setTab] = useState('orders');
  return (
    <ManagerShell title="Purchasing & suppliers" refCode="I-04">
      <div className="border-b border-line bg-paper-2 px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="border-b-0" />
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === 'orders' ? <OrdersTab /> : <SuppliersTab />}
      </div>
    </ManagerShell>
  );
}
