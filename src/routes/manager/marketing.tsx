import { useState } from 'react';
import { MessageCircle, Mail, Smartphone } from 'lucide-react';
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
import { Textarea } from '@/components/ui/Textarea';
import { isFailure } from '@/lib/api/http';
import {
  useCampaigns,
  useCoupons,
  useSaveCampaign,
  useSendCampaign,
  useSaveCoupon,
} from '@/hooks/useErp';
import type { Campaign, CampaignAudience, CampaignChannel, Coupon } from '@/types/erp';

const TABS = [
  { key: 'campaigns', code: 'G-3', label: 'Campaigns' },
  { key: 'coupons', code: 'G-4', label: 'Coupons' },
];

const CHANNEL_ICON = { whatsapp: MessageCircle, sms: Smartphone, email: Mail };
const CAMPAIGN_CHIP: Record<Campaign['status'], ChipVariant> = {
  draft: 'muted',
  scheduled: 'amber',
  sent: 'success',
};
const COUPON_CHIP: Record<Coupon['status'], ChipVariant> = {
  active: 'success',
  scheduled: 'amber',
  expired: 'muted',
  used_up: 'alert',
};

const AUDIENCES: { key: CampaignAudience; label: string }[] = [
  { key: 'all', label: 'All customers' },
  { key: 'loyalty', label: 'Loyalty members' },
  { key: 'recent_30', label: 'Visited in last 30 days' },
  { key: 'lapsed_30', label: 'Lapsed > 30 days' },
  { key: 'lapsed_90', label: 'Lapsed > 90 days' },
];

const CHANNELS: CampaignChannel[] = ['whatsapp', 'sms', 'email'];

function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

function CampaignForm({ existing, onClose }: { existing?: Campaign; onClose: () => void }) {
  const save = useSaveCampaign();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(existing?.name ?? '');
  const [channel, setChannel] = useState<CampaignChannel>(existing?.channel ?? 'whatsapp');
  const [audience, setAudience] = useState<CampaignAudience>(existing?.audience ?? 'all');
  const [schedule, setSchedule] = useState(Boolean(existing?.scheduledAt));
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(existing?.scheduledAt));

  const submit = async () => {
    setError(null);
    const res = await save.mutateAsync({
      campaign: existing?.id,
      name,
      channel,
      audience,
      scheduledAt: schedule ? scheduledAt.replace('T', ' ') + ':00' : null,
    });
    if (isFailure(res)) {
      setError(res.message);
      return;
    }
    onClose();
  };

  return (
    <FormDialog
      title={existing ? `Edit ${existing.name}` : 'New campaign'}
      refCode="G-3"
      submitLabel={existing ? 'Save campaign' : 'Create campaign'}
      onSubmit={() => void submit()}
      onClose={onClose}
      busy={save.isPending}
      error={error}
      disabled={!name.trim()}
    >
      <Field label="Campaign name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Channel">
        <Select
          value={channel}
          onChange={(e) => setChannel(e.target.value as CampaignChannel)}
          options={CHANNELS.map((c) => ({ value: c, label: c }))}
        />
      </Field>
      <Field label="Audience" hint="counted live when the list loads">
        <Select
          value={audience}
          onChange={(e) => setAudience(e.target.value as CampaignAudience)}
          options={AUDIENCES.map((a) => ({ value: a.key, label: a.label }))}
        />
      </Field>
      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
        Schedule it
      </label>
      {schedule && (
        <Field label="Send at">
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </Field>
      )}
    </FormDialog>
  );
}

function CampaignsTab() {
  const { data, isLoading, isError, refetch } = useCampaigns();
  const send = useSendCampaign();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [result, setResult] = useState<{ reach: number; note: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const doSend = async (id: string) => {
    setSendError(null);
    const res = await send.mutateAsync(id);
    if (isFailure(res)) {
      setSendError(res.message);
      return;
    }
    setResult({ reach: res.reach, note: res.note });
  };

  if (isError) return <ErrorState label="campaigns" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted">
          Audience sizes are counted live against the customer base.
        </span>
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          + New campaign
        </Button>
      </div>

      {sendError && (
        <p role="alert" className="mb-3 rounded border border-alert/40 bg-alert/10 px-3 py-2 text-xs text-alert">
          {sendError}
        </p>
      )}
      {result && (
        <div className="mb-3 rounded border border-amber/50 bg-[#F4EFE0] px-3 py-2 text-[12.5px] text-ink">
          Recorded as sent to {result.reach} {result.reach === 1 ? 'customer' : 'customers'}.{' '}
          {result.note}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setResult(null)}
          >
            dismiss
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState message="No campaigns yet." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((c) => {
            const Icon = CHANNEL_ICON[c.channel];
            return (
              <div key={c.id} className="relative rounded-md border border-line bg-paper-2 p-5">
                <CornerTicks />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-teal-3 text-teal">
                      <Icon size={16} />
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="text-left font-display text-sm font-semibold text-ink hover:underline"
                      >
                        {c.name}
                      </button>
                      <div className="font-mono text-[11px] uppercase tracking-ref text-muted">
                        {c.channel}
                      </div>
                    </div>
                  </div>
                  <Chip variant={CAMPAIGN_CHIP[c.status]}>{c.status}</Chip>
                </div>
                <div className="mt-3 flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">{c.audienceLabel}</span>
                  <span className="font-mono text-ink">reach {c.reach}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted">{c.scheduledLabel}</span>
                  {c.status !== 'sent' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={send.isPending || c.reach === 0}
                      onClick={() => void doSend(c.id)}
                    >
                      Mark sent
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && <CampaignForm onClose={() => setCreating(false)} />}
      {editing && <CampaignForm existing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

function CouponForm({ existing, onClose }: { existing?: Coupon; onClose: () => void }) {
  const save = useSaveCoupon();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(existing?.code && existing.code !== '—' ? existing.code : '');
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [maximumUse, setMaximumUse] = useState(String(existing?.limit || 100));
  const [validUpto, setValidUpto] = useState(existing?.validUpto ?? '');

  const submit = async () => {
    setError(null);
    const res = await save.mutateAsync({
      coupon: existing?.ref,
      code,
      name,
      description,
      discountType,
      discountValue: Number(discountValue) || 0,
      maximumUse: Number(maximumUse) || 0,
      validUpto: validUpto || null,
    });
    if (isFailure(res)) {
      setError(res.message);
      return;
    }
    onClose();
  };

  return (
    <FormDialog
      title={existing ? `Edit ${existing.code}` : 'New coupon'}
      refCode="G-4"
      submitLabel={existing ? 'Save coupon' : 'Create coupon'}
      onSubmit={() => void submit()}
      onClose={onClose}
      busy={save.isPending}
      error={error}
      disabled={!name.trim() || !code.trim()}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Code" hint="what the guest types">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EID25"
            required
          />
        </Field>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Discount type">
          <Select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
            options={[
              { value: 'percentage', label: 'Percentage' },
              { value: 'amount', label: 'Fixed amount' },
            ]}
          />
        </Field>
        <Field label={discountType === 'percentage' ? 'Percent off' : 'Rupees off'}>
          <Input
            type="number"
            min="1"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            required
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Max uses">
          <Input
            type="number"
            min="0"
            value={maximumUse}
            onChange={(e) => setMaximumUse(e.target.value)}
          />
        </Field>
        <Field label="Valid until">
          <Input type="date" value={validUpto} onChange={(e) => setValidUpto(e.target.value)} />
        </Field>
      </div>
      <p className="text-[12px] text-muted">
        Saving also creates the Pricing Rule behind the code, so it discounts a real bill at
        the till.
      </p>
    </FormDialog>
  );
}

function CouponsTab() {
  const { data, isLoading, isError, refetch } = useCoupons();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  if (isError) return <ErrorState label="coupons" onRetry={() => void refetch()} />;
  if (isLoading) return <Skeleton />;

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          + New coupon
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No coupons yet." />
      ) : (
        <>
          <DataRow header cols="140px 1fr 110px 110px 120px 100px">
            <span>Code</span>
            <span>Description</span>
            <span>Discount</span>
            <span className="text-right">Used / limit</span>
            <span className="text-right">Valid to</span>
            <span className="text-right">Status</span>
          </DataRow>
          {rows.map((c) => (
            <DataRow key={c.ref} cols="140px 1fr 110px 110px 120px 100px">
              <button
                type="button"
                onClick={() => setEditing(c)}
                className="text-left font-mono text-[12px] font-semibold text-ink hover:underline"
              >
                {c.code}
              </button>
              <span className="truncate text-[12.5px] text-muted">{c.description}</span>
              <span className="font-mono text-teal">{c.discountLabel}</span>
              <span className="text-right font-mono text-muted">
                {c.used} / {c.limit || '∞'}
              </span>
              <span className="text-right font-mono text-muted">{c.validUptoLabel}</span>
              <span className="flex justify-end">
                <Chip variant={COUPON_CHIP[c.status]}>{c.status.replace('_', ' ')}</Chip>
              </span>
            </DataRow>
          ))}
        </>
      )}

      {creating && <CouponForm onClose={() => setCreating(false)} />}
      {editing && <CouponForm existing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded bg-paper-3" />
      ))}
    </div>
  );
}

export default function ManagerMarketing() {
  const [tab, setTab] = useState('campaigns');
  return (
    <ManagerShell title="Marketing" refCode="G-03">
      <div className="border-b border-line bg-paper-2 px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="border-b-0" />
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === 'campaigns' ? <CampaignsTab /> : <CouponsTab />}
      </div>
    </ManagerShell>
  );
}
