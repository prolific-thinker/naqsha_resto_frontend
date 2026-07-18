import type { OwnerDashboard } from '@/types/domain';

const HOURS = [18, 24, 34, 42, 38, 28, 32, 44, 72, 94, 88, 64, 48, 22];
const HOUR_LABELS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

export const OWNER_DASHBOARD: OwnerDashboard = {
  greet: 'Wed 16 July · closing summary',
  ownerName: 'Zafar bhai',
  lead: "Session closed at 22:14 · today's numbers, and a few things worth your attention below.",
  pnl: {
    netProfit: 28420,
    periodLabel: 'Wed 16 Jul · 08:00 – 22:14',
    deltaLabel: '↑ 14.2% vs 7-day avg',
    lines: [
      { label: 'Gross revenue', value: 78340, pct: '100%' },
      { label: '— COGS (BOM)', value: -32180, pct: '41.1%' },
      { label: '— Wastage', value: -1240, pct: '1.6%' },
      { label: '— Fixed (daily share)', value: -12500, pct: '15.9%' },
      { label: '— Utilities est.', value: -4000, pct: '5.1%' },
      { label: 'Net profit', value: 28420, pct: '36.3%' },
    ],
  },
  miniStats: [
    { label: 'Covers served', value: '148', delta: '↑ 22 vs 7-day avg', deltaTone: 'up', aux: 'avg ₨ 529 / cover' },
    { label: 'Avg ticket', value: '₨ 2,410', delta: '↑ 6.8%', deltaTone: 'up', aux: '32 tickets · 3.2 avg pax' },
    { label: 'Feedback captured', value: '44%', delta: '14 QR · 6 verbal · 4.4★ avg', deltaTone: 'up', aux: 'target 40%' },
  ],
  revenueByHour: HOURS.map((pct, i) => ({
    hour: HOUR_LABELS[i] ?? '',
    pct,
    peak: pct >= 72,
  })),
  peakNote: 'Peak · 19:00 hr · ₨ 12,340 · 22 covers · matches historical Thursday pattern',
  bestDishes: [
    { rank: 1, name: 'Chicken karahi', category: 'Main', count: 24, revenue: 28320 },
    { rank: 2, name: 'Beef bihari', category: 'BBQ', count: 18, revenue: 20520 },
    { rank: 3, name: 'Chicken tikka', category: 'BBQ', count: 14, revenue: 12460 },
    { rank: 4, name: 'Karak chai', category: 'Drinks', count: 42, revenue: 10500 },
    { rank: 5, name: 'Café latte', category: 'Drinks', count: 18, revenue: 9360 },
    { rank: 6, name: 'Malai boti', category: 'BBQ', count: 9, revenue: 8280 },
  ],
  bottomNote:
    'Bottom performer today · Matcha latte · 0 sold · out of stock since 14:22 → restock note sent',
};
