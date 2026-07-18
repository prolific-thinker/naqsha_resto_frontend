import { Link } from 'react-router-dom';
import { CornerTicks } from '@/components/naqsha/CornerTicks';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Chip, type ChipVariant } from '@/components/naqsha/Chip';
import { StatTile } from '@/components/naqsha/StatTile';
import { DataRow } from '@/components/naqsha/DataRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

const CHIP_VARIANTS: ChipVariant[] = ['teal', 'amber', 'success', 'alert', 'muted', 'ink'];

const SCREENS: { code: string; label: string; to: string }[] = [
  { code: 'A-01', label: 'Waiter · Table select', to: '/waiter/tables' },
  { code: 'A-02', label: 'Waiter · Menu + cart', to: '/waiter/tables/T-02' },
  { code: 'K-01', label: 'KDS · Drinks', to: '/kds/drinks' },
  { code: 'K-01', label: 'KDS · Main', to: '/kds/main' },
  { code: 'K-01', label: 'KDS · BBQ', to: '/kds/bbq' },
  { code: 'M-01', label: 'Manager · Floor', to: '/manager/floor' },
  { code: 'M-02', label: 'Manager · KDS aggregate', to: '/manager/kds' },
  { code: 'M-03', label: 'Manager · POS', to: '/manager/pos/T-07' },
  { code: 'M-04', label: 'Manager · Wastage', to: '/manager/wastage' },
  { code: 'M-05', label: 'Manager · Cameras', to: '/manager/cameras' },
  { code: 'O-01', label: 'Owner · Dashboard', to: '/owner/dashboard' },
  { code: 'O-02', label: 'Owner · Wastage approvals', to: '/owner/wastage' },
  { code: 'C-01', label: 'Customer · Feedback', to: '/feedback/T-02' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-code text-saffron">{title}</h2>
      {children}
    </section>
  );
}

export default function DevGallery() {
  return (
    <div className="min-h-screen bg-paper px-10 py-10 text-ink">
      <header className="mb-10">
        <div className="font-mono text-[11px] uppercase tracking-code text-muted">
          Naqsha · design system
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.02em]">Component gallery</h1>
        <p className="mt-1 text-sm text-muted">Dev-only. Primitives + screen index.</p>
      </header>

      <Section title="Screen index">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SCREENS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="relative rounded-md border border-line bg-paper-2 px-4 py-3 hover:border-teal"
            >
              <SheetRef>{s.code}</SheetRef>
              <div className="mt-1 font-display text-sm font-semibold">{s.label}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Chips">
        <div className="flex flex-wrap gap-3">
          {CHIP_VARIANTS.map((v) => (
            <Chip key={v} variant={v}>
              {v}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Submit order</Button>
          <Button variant="ghost">Save draft</Button>
          <Button variant="saffron">Send for approval →</Button>
          <Button variant="alert">Escalate</Button>
          <Button variant="primary" size="lg">
            Take payment
          </Button>
          <Button variant="ghost" size="sm">
            Filter
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Sheet refs">
        <div className="flex flex-wrap gap-6">
          <SheetRef>A-01</SheetRef>
          <SheetRef>KOT-D-1042</SheetRef>
          <SheetRef>INV-C-2026-0234</SheetRef>
          <SheetRef>WST-C-2026-0018</SheetRef>
        </div>
      </Section>

      <Section title="Stat tiles">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Active orders" value="14" delta="↑ 3 vs yesterday" deltaTone="up" />
          <StatTile label="Avg prep time" value="08:14" delta="↓ 00:44 vs 7-day" deltaTone="up" />
          <StatTile label="SLA breaches" value="2" delta="T-03 · T-01" deltaTone="down" />
          <StatTile label="Wastage today" value="₨ 1,240" delta="2 entries · 1 pending" />
        </div>
      </Section>

      <Section title="Corner ticks">
        <div className="relative inline-block rounded-md border border-line bg-paper-2 px-8 py-6">
          <CornerTicks />
          <span className="font-mono text-xs text-muted">card with registration ticks</span>
        </div>
      </Section>

      <Section title="Data rows">
        <div className="max-w-xl">
          <DataRow header cols="40px 1fr 100px">
            <span>Qty</span>
            <span>Item</span>
            <span className="text-right">Amount</span>
          </DataRow>
          <DataRow cols="40px 1fr 100px">
            <span className="font-mono font-semibold">2×</span>
            <span>Chicken karahi</span>
            <span className="text-right font-mono font-semibold">2,360</span>
          </DataRow>
          <DataRow cols="40px 1fr 100px">
            <span className="font-mono font-semibold">6×</span>
            <span>Karak chai</span>
            <span className="text-right font-mono font-semibold">1,500</span>
          </DataRow>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-xl grid-cols-2 gap-4">
          <Input placeholder="Item name, code, or ingredient" />
          <Select
            placeholder="Select unit"
            options={[
              { value: 'plate', label: 'plate' },
              { value: 'pc', label: 'pc' },
              { value: 'kg', label: 'kg' },
            ]}
          />
          <Textarea className="col-span-2" placeholder="Notes for owner (optional)" rows={3} />
        </div>
      </Section>
    </div>
  );
}
