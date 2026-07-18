import type { AggregateRow, KdsBoard, Station } from '@/types/domain';

const DRINKS: KdsBoard = {
  meta: {
    station: 'drinks',
    name: 'Drinks & coffee',
    stationId: 'DRINKS',
    slaSeconds: 300,
    activeMax: 3,
    avgPrepLabel: '04:22',
    slaCompliancePct: 86,
    totalPrepared: 142,
  },
  queue: [
    { ref: 'KOT-D-1044', station: 'drinks', tableRef: 'T-07', state: 'queued', slaSeconds: 300, waitSeconds: 30, items: [{ name: 'Karak chai', qty: 2 }, { name: 'Cappuccino', qty: 1 }] },
    { ref: 'KOT-D-1045', station: 'drinks', tableRef: 'T-01', state: 'queued', slaSeconds: 300, waitSeconds: 72, items: [{ name: 'Iced americano', qty: 1 }] },
    { ref: 'KOT-D-1046', station: 'drinks', tableRef: 'TAKE-042', state: 'queued', slaSeconds: 300, waitSeconds: 124, items: [{ name: 'Turkish coffee', qty: 2, comment: '— extra sugar' }] },
    { ref: 'KOT-D-1047', station: 'drinks', tableRef: 'T-09', state: 'queued', slaSeconds: 300, waitSeconds: 168, items: [{ name: 'Café latte', qty: 1 }, { name: 'Espresso', qty: 1 }] },
  ],
  active: [
    { ref: 'KOT-D-1042', station: 'drinks', tableRef: 'T-05', state: 'preparing', slaSeconds: 300, elapsedSeconds: 134, items: [{ name: 'Cappuccino', qty: 2 }, { name: 'Karak chai', qty: 1 }] },
    { ref: 'KOT-D-1041', station: 'drinks', tableRef: 'T-03', state: 'breach', slaSeconds: 300, elapsedSeconds: 372, items: [{ name: 'Mint lemonade', qty: 2, comment: '— no salt on one' }] },
  ],
  prepared: [
    { ref: 'KOT-D-1039', station: 'drinks', tableRef: 'T-02', state: 'prepared', slaSeconds: 300, doneSeconds: 252, onTime: true, items: [{ name: 'Café latte', qty: 2 }, { name: 'Espresso', qty: 1 }] },
    { ref: 'KOT-D-1040', station: 'drinks', tableRef: 'T-06', state: 'prepared', slaSeconds: 300, doneSeconds: 224, onTime: true, items: [{ name: 'Karak chai', qty: 3 }] },
  ],
};

const MAIN: KdsBoard = {
  meta: {
    station: 'main',
    name: 'Main kitchen',
    stationId: 'MAIN',
    slaSeconds: 600,
    activeMax: 4,
    avgPrepLabel: '09:12',
    slaCompliancePct: 78,
    totalPrepared: 96,
  },
  queue: [
    { ref: 'KOT-M-2087', station: 'main', tableRef: 'T-09', state: 'queued', slaSeconds: 600, waitSeconds: 45, items: [{ name: 'Chicken biryani', qty: 2 }, { name: 'Raita', qty: 2 }] },
    { ref: 'KOT-M-2088', station: 'main', tableRef: 'T-04', state: 'queued', slaSeconds: 600, waitSeconds: 90, items: [{ name: 'Daal fry', qty: 1 }, { name: 'Naan', qty: 3 }] },
  ],
  active: [
    { ref: 'KOT-M-2085', station: 'main', tableRef: 'T-01', state: 'preparing', slaSeconds: 600, elapsedSeconds: 202, items: [{ name: 'Chicken handi', qty: 2 }, { name: 'Naan', qty: 4 }] },
    { ref: 'KOT-M-2086', station: 'main', tableRef: 'TAKE-041', state: 'preparing', slaSeconds: 600, elapsedSeconds: 432, items: [{ name: 'Chicken biryani', qty: 1 }, { name: 'Raita', qty: 2 }] },
  ],
  prepared: [
    { ref: 'KOT-M-2084', station: 'main', tableRef: 'T-05', state: 'prepared', slaSeconds: 600, doneSeconds: 524, onTime: true, items: [{ name: 'Chicken karahi', qty: 2 }, { name: 'Naan', qty: 4 }] },
    { ref: 'KOT-M-2083', station: 'main', tableRef: 'T-03', state: 'prepared', slaSeconds: 600, doneSeconds: 304, onTime: true, items: [{ name: 'Daal fry', qty: 1 }, { name: 'Naan', qty: 2 }] },
  ],
};

const BBQ: KdsBoard = {
  meta: {
    station: 'bbq',
    name: 'BBQ & grill',
    stationId: 'BBQ',
    slaSeconds: 720,
    activeMax: 2,
    avgPrepLabel: '11:48',
    slaCompliancePct: 71,
    totalPrepared: 64,
  },
  queue: [
    { ref: 'KOT-B-3061', station: 'bbq', tableRef: 'T-09', state: 'queued', slaSeconds: 720, waitSeconds: 70, items: [{ name: 'Seekh kebab', qty: 2 }] },
  ],
  active: [
    { ref: 'KOT-B-3059', station: 'bbq', tableRef: 'T-01', state: 'preparing', slaSeconds: 720, elapsedSeconds: 344, items: [{ name: 'Seekh kebab', qty: 1 }] },
    { ref: 'KOT-B-3058', station: 'bbq', tableRef: 'T-07', state: 'preparing', slaSeconds: 720, elapsedSeconds: 250, items: [{ name: 'Beef bihari', qty: 3 }] },
  ],
  prepared: [
    { ref: 'KOT-B-3057', station: 'bbq', tableRef: 'T-05', state: 'prepared', slaSeconds: 720, doneSeconds: 382, onTime: true, items: [{ name: 'Malai boti', qty: 1 }] },
    { ref: 'KOT-B-3056', station: 'bbq', tableRef: 'TAKE-041', state: 'prepared', slaSeconds: 720, doneSeconds: 360, onTime: true, items: [{ name: 'Chicken tikka', qty: 2 }] },
  ],
};

export const KDS_BOARDS: Record<Station, KdsBoard> = {
  drinks: DRINKS,
  main: MAIN,
  bbq: BBQ,
};

/**
 * M-02 aggregate — one row per open order, all three stations. Ready-across-all
 * rows float to top with a dispatch action; the API sorts by readiness.
 */
export const AGGREGATE_ROWS: AggregateRow[] = [
  {
    tableRef: 'T-05',
    tableNumber: '05',
    rowState: 'ready',
    stations: [
      { station: 'drinks', items: '2× cappuccino · 1× karak chai', status: 'ready', statusLabel: 'ready · 04:12' },
      { station: 'main', items: '2× chicken karahi · 4× naan', status: 'ready', statusLabel: 'ready · 08:44' },
      { station: 'bbq', items: '1× malai boti', status: 'ready', statusLabel: 'ready · 06:22' },
    ],
    action: { kind: 'dispatch', label: 'Dispatch waiter →', hint: '6 items · assign W-04' },
  },
  {
    tableRef: 'T-03',
    tableNumber: '03',
    rowState: 'breach',
    stations: [
      { station: 'drinks', items: '2× mint lemonade', status: 'prep', statusLabel: '06:12 · +01:12 over SLA', overSla: true },
      { station: 'main', items: '1× daal fry · 2× naan', status: 'ready', statusLabel: 'ready · 05:04' },
      { station: 'bbq', items: '— none —', status: 'none', statusLabel: 'no items' },
    ],
    action: { kind: 'escalate', label: 'Escalate → Drinks', hint: 'Waiter B · SLA -01:12' },
  },
  {
    tableRef: 'T-01',
    tableNumber: '01',
    rowState: 'normal',
    stations: [
      { station: 'drinks', items: '1× iced americano', status: 'queued', statusLabel: 'queued · 01:12 wait' },
      { station: 'main', items: '2× chicken handi · 4× naan', status: 'prep', statusLabel: '03:22 preparing' },
      { station: 'bbq', items: '1× seekh kebab', status: 'prep', statusLabel: '05:44 preparing' },
    ],
    action: { kind: 'waiting', label: 'Waiting on all 3', hint: 'ETA ~04:00' },
  },
  {
    tableRef: 'TAKE-041',
    tableNumber: '041',
    rowState: 'normal',
    stations: [
      { station: 'drinks', items: '— none —', status: 'none', statusLabel: 'no items' },
      { station: 'main', items: '1× biryani · 2× raita', status: 'prep', statusLabel: '07:12 preparing' },
      { station: 'bbq', items: '2× chicken tikka', status: 'ready', statusLabel: 'ready · 06:00' },
    ],
    action: { kind: 'waiting', label: 'Wait on Main', hint: 'Pickup: counter' },
  },
];
