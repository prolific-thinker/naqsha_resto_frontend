import { useState } from 'react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { Chip } from '@/components/naqsha/Chip';
import { DataRow } from '@/components/naqsha/DataRow';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { EmptyState } from '@/components/naqsha/EmptyState';
import { FormDialog, Field } from '@/components/naqsha/FormDialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCustomers, useCustomerHistory, useSaveCustomer } from '@/hooks/useErp';
import { isFailure } from '@/lib/api/http';
import type { Customer } from '@/types/erp';

function Detail({ c, onEdit }: { c: Customer; onEdit: () => void }) {
  // Loaded per selection, not with the list — see `crm.customer_history`.
  const { data: history, isLoading, isError, refetch } = useCustomerHistory(c.id);

  return (
    <div className="relative rounded-md border border-line bg-paper-2 p-6">
      <CornerTicks />
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-ref text-muted">{c.id}</div>
          <h3 className="mt-1 font-display text-xl font-bold text-ink">{c.name}</h3>
          <div className="font-mono text-[12px] text-muted">{c.phone || 'no number on file'}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip variant="muted">{c.group}</Chip>
            {c.tags.map((t) => (
              <Chip key={t} variant="teal">
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-ref text-muted">loyalty points</div>
          <div className="font-display text-2xl font-bold text-saffron">{c.loyaltyPoints}</div>
          <div className="font-mono text-[11px] text-muted">{c.sinceLabel}</div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Mini label="Visits" value={String(c.visits)} />
        <Mini label="Total spend" value={`₨ ${money(c.totalSpend)}`} />
        <Mini
          label="Avg ticket"
          value={c.visits ? `₨ ${money(Math.round(c.totalSpend / c.visits))}` : '—'}
        />
      </div>

      <div className="mt-5">
        <h4 className="mb-2 font-display text-sm font-semibold text-ink">Recent visits</h4>
        {isError ? (
          <ErrorState label="visit history" onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-paper-3" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <>
            <DataRow header cols="150px 1fr 110px">
              <span>Invoice</span>
              <span>Items</span>
              <span className="text-right">Amount</span>
            </DataRow>
            {history.map((h) => (
              <DataRow key={h.invoiceRef} cols="150px 1fr 110px">
                <span className="font-mono text-[11px] text-muted">{h.invoiceRef}</span>
                <span className="text-[12.5px] text-ink">
                  {h.itemsLabel}
                  <span className="ml-2 text-muted">{h.dateLabel}</span>
                </span>
                <span className="text-right font-mono font-semibold">₨ {money(h.amount)}</span>
              </DataRow>
            ))}
          </>
        ) : (
          <EmptyState message="No submitted invoices for this customer yet." />
        )}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-paper px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-ref text-muted">{label}</div>
      <div className="mt-0.5 font-display text-base font-bold text-ink">{value}</div>
    </div>
  );
}

function CustomerDialog({ editing, onClose }: { editing: Customer | null; onClose: () => void }) {
  const save = useSaveCustomer();
  const [name, setName] = useState(editing?.name ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!name.trim()) return setError('A customer name is required.');
    save.mutate(
      { customer: editing?.id, name: name.trim(), phone: phone.trim() || undefined },
      {
        onSuccess: (res) => (isFailure(res) ? setError(res.message) : onClose()),
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not save.'),
      },
    );
  };

  return (
    <FormDialog
      title={editing ? `Edit ${editing.name}` : 'New customer'}
      refCode="G-1 · Customer"
      submitLabel="Save"
      onSubmit={submit}
      onClose={onClose}
      busy={save.isPending}
      error={error}
    >
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Mobile" hint="matched at the till">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" />
      </Field>
      <p className="font-mono text-[10px] text-muted">
        The number is normalised to digits before saving, so it matches the one billing
        looks up. Spaces and dashes are fine to type.
      </p>
    </FormDialog>
  );
}

export default function ManagerCustomers() {
  const { data, isLoading, isError, refetch } = useCustomers();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ editing: Customer | null } | null>(null);

  // Filtered in the browser: the whole book is one request and the server's `search`
  // argument would cost a round trip per keystroke to do the same thing.
  const needle = q.trim().toLowerCase();
  const customers = (data ?? []).filter(
    (c) => !needle || c.name.toLowerCase().includes(needle) || c.phone.includes(needle),
  );
  const active = customers.find((c) => c.id === selected) ?? customers[0];

  return (
    <ManagerShell
      title="Customers & loyalty"
      refCode="G-01"
      right={
        <Button variant="primary" size="sm" onClick={() => setDialog({ editing: null })}>
          + New customer
        </Button>
      }
    >
      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden px-6 py-6 lg:grid-cols-[340px_1fr]">
        <div className="flex flex-col overflow-hidden">
          <Input placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-ref text-muted">
            {customers.length} of {data?.length ?? 0} customers
          </p>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
            {isError ? (
              <ErrorState label="customers" onRetry={() => void refetch()} />
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-paper-3" />
              ))
            ) : customers.length === 0 ? (
              <EmptyState message={needle ? 'No match.' : 'No customers yet.'} />
            ) : (
              customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    'w-full rounded-md border px-4 py-3 text-left',
                    active?.id === c.id
                      ? 'border-teal bg-teal-3'
                      : 'border-line bg-paper-2 hover:border-line-strong',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="font-mono text-[11px] text-saffron">{c.loyaltyPoints} pts</span>
                  </div>
                  <div className="font-mono text-[11px] text-muted">
                    {c.phone || 'no number'} · {c.visits} visits
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="overflow-y-auto">
          {active ? <Detail c={active} onEdit={() => setDialog({ editing: active })} /> : null}
        </div>
      </div>

      {dialog && <CustomerDialog editing={dialog.editing} onClose={() => setDialog(null)} />}
    </ManagerShell>
  );
}
