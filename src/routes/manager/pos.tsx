import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { DataRow } from '@/components/naqsha/DataRow';
import { ErrorState } from '@/components/naqsha/ErrorState';
import { Button } from '@/components/ui/Button';
import { BillLine } from '@/components/bill/BillLine';
import { BatchMarker } from '@/components/bill/BatchMarker';
import { SplitStepper } from '@/components/bill/SplitStepper';
import { cn } from '@/lib/utils';
import { money } from '@/lib/format';

import { useInvoice, useOpenInvoice } from '@/hooks/useInvoice';
import { FormDialog, Field } from '@/components/naqsha/FormDialog';
import { Input } from '@/components/ui/Input';
import { useManagerTables } from '@/hooks/useOpenTables';
import { usePayInvoice, useUpdateInvoice } from '@/hooks/useActions';
import { BusinessError, isFailure } from '@/lib/api/http';
import { makeRef } from '@/lib/idempotency';
import { useNavigate } from 'react-router-dom';
import { money as fmtMoney } from '@/lib/format';
import type { Table } from '@/types/domain';

/**
 * Modes of payment come from the SERVER (`invoice.modesOfPayment`), not a literal.
 * `pay_invoice` matches the string against real `Mode of Payment` names and rejects
 * anything else with BAD_MODE_OF_PAYMENT, so a hard-coded trio breaks on any site
 * whose modes differ. FALLBACK_MOPS only covers a payload that predates the field.
 */
const FALLBACK_MOPS = ['Cash', 'Card'];

/** A table can be billed once it has an open order — i.e. anything but `free`. */
function isBillable(t: Table): boolean {
  return t.state !== 'free';
}

/**
 * Choosing which table to bill.
 *
 * The sidebar used to point at a hard-coded `/manager/pos/T-07`, a leftover from the
 * mock era: on a real site that table has no open order, so every manager who tapped
 * POS landed on a bill that could never load. Billing is per-table, so the entry point
 * has to ask which table rather than guess one.
 */
function TablePicker({ note }: { note?: string }) {
  const navigate = useNavigate();
  const { data: tables, isLoading, isError, refetch } = useManagerTables();
  const billable = (tables ?? []).filter(isBillable);

  return (
    <ManagerShell title="Bill preview" refCode="select a table">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {note && (
          <p className="mb-4 rounded border border-amber/50 bg-[#F4EFE0] px-3 py-2 text-[13px] text-ink">
            {note}
          </p>
        )}
        <h3 className="mb-1 font-display text-lg font-semibold text-ink">
          Which table are you billing?
        </h3>
        <p className="mb-4 text-[13px] text-muted">Only tables with an open order can be billed.</p>

        {isError ? (
          <ErrorState label="the floor" onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="min-h-[96px] animate-pulse rounded-md bg-paper-3" />
            ))}
          </div>
        ) : billable.length === 0 ? (
          <div className="rounded-md border border-dashed border-line-strong p-8 text-center">
            <div className="text-[13px] text-muted">No table has an open order right now.</div>
            <button
              type="button"
              onClick={() => navigate('/manager/floor')}
              className="mt-3 rounded border border-line-strong px-3 py-1.5 font-body text-xs font-semibold text-ink hover:bg-paper-3"
            >
              Go to floor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {billable.map((t) => (
              <button
                key={t.ref}
                type="button"
                onClick={() => navigate(`/manager/pos/${t.ref}`)}
                className="relative rounded-md border border-line bg-paper p-4 text-left hover:border-line-strong hover:bg-paper-3"
              >
                <CornerTicks />
                <div className="font-mono text-[10px] uppercase tracking-code text-muted">{t.ref}</div>
                <div className="mt-1 font-display text-[26px] font-bold tracking-[-0.02em] text-ink">
                  {t.number}
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted">
                  {t.pax ? `${t.pax} pax` : '—'}
                  {t.amount ? ` · ₨ ${fmtMoney(t.amount)}` : ''}
                </div>
                {t.waiter?.name && (
                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted">{t.waiter.name}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </ManagerShell>
  );
}

export default function ManagerPos() {
  const { tableId } = useParams();
  // No table in the URL — ask which one rather than guessing at one.
  if (!tableId) return <TablePicker />;
  // Keyed so switching tables remounts and re-mints the payment idempotency ref.
  return <PosBill key={tableId} tableId={tableId} />;
}

/**
 * The table has an open order but no bill yet. Opening one creates the draft invoice
 * and moves the table to `billing`, so it is an explicit action rather than something
 * that happens because a manager looked at the screen.
 */
function OpenBillPrompt({ tableId, message }: { tableId: string; message: string }) {
  const open = useOpenInvoice(tableId);
  const [failed, setFailed] = useState<string | null>(null);

  const openBill = async () => {
    setFailed(null);
    try {
      await open.mutateAsync();
    } catch (e) {
      setFailed((e as Error).message);
    }
  };

  return (
    <ManagerShell title="Bill preview" refCode={`${tableId} · no bill open`}>
      <div className="grid flex-1 place-items-center p-6">
        <div className="relative w-full max-w-md rounded-md border border-line bg-paper p-6 text-center">
          <CornerTicks />
          <div className="font-mono text-[10px] uppercase tracking-code text-muted">{tableId}</div>
          <h3 className="mt-2 font-display text-lg font-semibold text-ink">{message}</h3>
          <p className="mt-2 text-[13px] text-muted">
            Opening the bill moves this table to billing and stops further ordering.
          </p>
          {failed && (
            <p role="alert" className="mt-3 rounded border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
              {failed}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            className="mt-4 w-full"
            disabled={open.isPending}
            onClick={() => void openBill()}
          >
            {open.isPending ? 'Opening bill…' : 'Open bill'}
          </Button>
        </div>
      </div>
    </ManagerShell>
  );
}

/**
 * Coupon and guest attachment — the two adjustments that actually stick.
 *
 * These were two ghost buttons ("+ Discount", "+ Note") with no handler. The obvious
 * fix, a manual discount percentage, does NOT work: ERPNext walks every enabled
 * transaction-level Pricing Rule on save and, for a coupon-based one with no coupon on
 * the document, sets `additional_discount_percentage` and `discount_amount` to zero
 * outright. The moment the restaurant has one live coupon, a typed percentage silently
 * evaporates. See FRAPPE_GOTCHAS.md §36.
 *
 * So money comes off a bill the way ERPNext supports it: a **coupon**, which the
 * Marketing screen creates. That also makes redemption countable — `used` on the
 * Coupon Code moves — which a free-form percentage never would.
 */
function AdjustDialog({
  tableId,
  invoiceRef,
  currentCoupon,
  onClose,
}: {
  tableId: string;
  invoiceRef: string;
  currentCoupon?: string;
  onClose: () => void;
}) {
  const update = useUpdateInvoice(tableId);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState(currentCoupon ?? '');
  const [phone, setPhone] = useState('');

  const submit = async () => {
    setError(null);
    const res = await update.mutateAsync({
      invoice: invoiceRef,
      // '' clears the coupon; undefined leaves it alone.
      couponCode: coupon.trim().toUpperCase(),
      customerPhone: phone || undefined,
    });
    if (isFailure(res)) {
      setError(res.message);
      return;
    }
    onClose();
  };

  return (
    <FormDialog
      title="Coupon & guest"
      refCode={invoiceRef}
      submitLabel="Apply"
      onSubmit={() => void submit()}
      onClose={onClose}
      busy={update.isPending}
      error={error}
    >
      <Field label="Coupon code" hint="leave blank to remove">
        <Input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          placeholder="EID25"
        />
      </Field>
      <Field label="Guest phone" hint="attaches the bill for loyalty">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" />
      </Field>
      <p className="text-[12px] text-muted">
        A matching customer is linked to this bill and to the order behind it, so points
        accrue even though the table was opened anonymously.
      </p>
    </FormDialog>
  );
}

function PosBill({ tableId }: { tableId: string }) {
  const { data: inv, isLoading, isError, error, refetch } = useInvoice(tableId);
  const navigate = useNavigate();
  const pay = usePayInvoice(tableId);
  const [split, setSplit] = useState(4);
  const [mop, setMop] = useState<string>('');
  const [payError, setPayError] = useState<string | null>(null);
  // Minted once per visit to this bill and reused across retries of the same tap.
  const [payRef] = useState(() => makeRef('si'));
  const [adjusting, setAdjusting] = useState(false);

  const mops = inv?.modesOfPayment?.length ? inv.modesOfPayment : FALLBACK_MOPS;
  const selectedMop = mop || mops[0] || 'Cash';

  const takePayment = async () => {
    if (!inv || pay.isPending) return;
    setPayError(null);
    const res = await pay.mutateAsync({
      invoice: inv.ref,
      // grandTotal is already the ROUNDED total; pay_invoice rejects anything under it.
      payments: [{ mode: selectedMop, amount: inv.grandTotal }],
      offlineRef: payRef,
    });
    if (isFailure(res)) {
      // Already paid is not a failure from the user's point of view.
      if (res.code === 'INVOICE_NOT_DRAFT') {
        navigate('/manager/floor');
        return;
      }
      setPayError(res.message);
      return;
    }
    navigate('/manager/floor');
  };

  if (isError) {
    // A BusinessError is the server telling us something true about this table
    // (no open order, POS shift closed) — not a transport failure. Offering "Retry"
    // for it is a dead end; offering another table is the actual next step.
    // There is something to bill here, just no bill yet — offer to open one.
    if (error instanceof BusinessError && error.code === 'NO_INVOICE') {
      return <OpenBillPrompt tableId={tableId} message={error.message} />;
    }
    if (error instanceof BusinessError) {
      return <TablePicker note={`${tableId} — ${error.message}`} />;
    }
    return (
      <ManagerShell title="Bill preview" refCode="unavailable">
        <div className="grid flex-1 place-items-center p-6">
          <ErrorState
            label={(error as { message?: string } | null)?.message ?? 'the bill'}
            onRetry={() => void refetch()}
          />
        </div>
      </ManagerShell>
    );
  }

  if (isLoading || !inv) {
    return (
      <ManagerShell title="Bill preview" refCode="loading…">
        <div className="grid flex-1 place-items-center font-mono text-xs uppercase tracking-code text-muted">
          Loading bill…
        </div>
      </ManagerShell>
    );
  }

  const perPerson = Math.round(inv.grandTotal / split);
  const avgPerPax = Math.round(inv.grandTotal / inv.pax);

  return (
    <ManagerShell
      title="Bill preview"
      refCode={`${inv.ref} · draft`}
      right={
        <>
          <span className="font-mono text-[11px] text-muted">
            Waiter · <strong className="text-ink">{inv.waiter.name} {inv.waiter.id}</strong>
          </span>
          <span className="font-mono text-[11px] text-muted">
            Duration · <strong className="text-ink">{inv.durationLabel}</strong>
          </span>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            Print preview
          </Button>
        </>
      }
    >
      <div className="grid flex-1 grid-cols-[1.4fr_1fr] overflow-hidden">
        {/* Bill preview */}
        <div className="overflow-y-auto bg-paper px-6 py-5">
          <div className="mb-5 flex items-start justify-between border-b border-line pb-5">
            <div>
              <h3 className="font-display text-[28px] font-bold tracking-[-0.02em] text-ink">
                Table {inv.tableNumber}
                <span className="ml-2 font-mono text-sm font-medium text-muted">· {inv.pax} pax</span>
              </h3>
              <div className="mt-1 font-mono text-xs tracking-[0.03em] text-muted">
                <span>Opened {inv.openedAtLabel}</span>
                <span className="mx-2 text-line-strong">·</span>
                <span>{inv.waiter.name} {inv.waiter.id}</span>
                <span className="mx-2 text-line-strong">·</span>
                <span>{inv.batches.length} order batches</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdjusting(true)}>
                {inv.couponCode ? `Coupon ${inv.couponCode}` : '+ Coupon'}
              </Button>
              {/* Sales Invoice has no free-text note the bill renders, so this is
                  disabled and labelled rather than left as a control that does
                  nothing — same treatment as the takeaway button on the floor. */}
              <Button variant="ghost" size="sm" disabled title="Bill notes land in v1.1">
                + Note
              </Button>
            </div>
          </div>

          <DataRow header cols="40px 1fr 60px 100px">
            <span>Qty</span>
            <span>Item</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </DataRow>

          {inv.batches.map((batch, bi) => (
            <div key={bi}>
              {batch.label && <BatchMarker label={batch.label} />}
              {batch.lines.map((line, li) => (
                <BillLine key={`${bi}-${li}`} line={line} />
              ))}
            </div>
          ))}

          <div className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line-strong py-3 pt-4">
            <span />
            <span className="font-display text-sm font-semibold text-ink">
              Subtotal · {inv.subtotalItems} items
            </span>
            <span />
            <span className="text-right font-mono text-[13px] font-semibold text-ink">
              {money(inv.subtotal)}
            </span>
          </div>
          {inv.serviceCharge > 0 && (
            <div className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line py-3">
              <span />
              <span className="text-[13px] text-muted">Service charge ({inv.serviceChargePct}%)</span>
              <span />
              <span className="text-right font-mono text-[13px] text-muted">
                {money(inv.serviceCharge)}
              </span>
            </div>
          )}
          {inv.discount !== undefined && (
            <div className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line py-3">
              <span />
              <span className="text-[13px] text-alert">{inv.discountLabel}</span>
              <span />
              <span className="text-right font-mono text-[13px] text-alert">
                −{money(inv.discount)}
              </span>
            </div>
          )}
          {/* Tax rows, so the preview visibly adds up to the grand total the guest pays. */}
          {inv.taxes.map((t, i) => (
            <div
              key={`${t.description}-${i}`}
              className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 border-b border-line py-3"
            >
              <span />
              <span className="text-[13px] text-muted">{t.description}</span>
              <span />
              <span className="text-right font-mono text-[13px] text-muted">{money(t.amount)}</span>
            </div>
          ))}
          <div className="grid grid-cols-[40px_1fr_60px_100px] items-center gap-3 py-3">
            <span />
            <span className="font-display text-sm font-semibold text-ink">Total</span>
            <span />
            <span className="text-right font-mono text-[13px] font-semibold text-ink">
              {money(inv.grandTotal)}
            </span>
          </div>
        </div>

        {/* Total / split / MOP */}
        <aside className="flex flex-col gap-4 overflow-y-auto border-l border-line bg-paper-2 p-6">
          <div className="relative rounded-md bg-ink p-5 text-paper">
            <CornerTicks />
            <div className="font-mono text-[10px] uppercase tracking-code text-muted-2">
              Grand total
            </div>
            <div className="mt-2 font-display text-[40px] font-bold tracking-[-0.02em]">
              <span className="mr-1.5 align-[6px] font-mono text-xl font-medium text-muted-2">₨</span>
              {money(inv.grandTotal)}
            </div>
            <div className="mt-1 font-mono text-[11px] text-saffron">
              {inv.pax} pax · avg ₨ {money(avgPerPax)} per person
            </div>
          </div>

          <div className="relative rounded-md border border-line bg-paper p-[18px]">
            <CornerTicks />
            <h4 className="mb-3 font-display text-sm font-semibold text-ink">Split bill</h4>
            <div className="my-3 flex items-center gap-3 rounded-sm bg-paper-3 p-3">
              <span className="flex-1 text-xs text-muted">Split evenly across</span>
              <SplitStepper value={split} onChange={setSplit} />
              <span className="text-xs text-muted">people</span>
            </div>
            <div className="mt-2.5 rounded-sm border border-dashed border-saffron bg-[#F4EFE0] p-3 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                Per-person share
              </div>
              <div className="mt-1 font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
                ₨ {money(perPerson)}
              </div>
            </div>
            <div className="mt-3 flex justify-between font-mono text-[11px] text-muted">
              <span>Printed on bill</span>
              <span>{split} lines below total</span>
            </div>
          </div>

          <div className="relative rounded-md border border-line bg-paper p-[18px]">
            <CornerTicks />
            <h4 className="mb-3 font-display text-sm font-semibold text-ink">Mode of payment</h4>
            <div className="grid grid-cols-3 gap-2">
              {mops.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selectedMop === name}
                  onClick={() => setMop(name)}
                  className={cn(
                    'rounded border px-2 py-3 text-center',
                    selectedMop === name
                      ? 'border-teal bg-teal-3 text-teal'
                      : 'border-line bg-paper-2',
                  )}
                >
                  <div className="font-display text-xs font-semibold">{name}</div>
                </button>
              ))}
            </div>
            {payError && (
              <p role="alert" className="mt-3 rounded border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
                {payError}
              </p>
            )}
            <Button
              variant="primary"
              size="lg"
              className="mt-3.5 w-full"
              disabled={pay.isPending}
              onClick={() => void takePayment()}
            >
              {pay.isPending ? 'Taking payment…' : 'Take payment · print bill'}
            </Button>
          </div>
        </aside>
      </div>

      {adjusting && (
        <AdjustDialog
          tableId={tableId}
          invoiceRef={inv.ref}
          currentCoupon={inv.couponCode}
          onClose={() => setAdjusting(false)}
        />
      )}
    </ManagerShell>
  );
}
