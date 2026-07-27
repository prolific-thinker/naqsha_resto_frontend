import { format as formatDate } from 'date-fns';

/** PKR currency without symbol: 3320 -> "3,320". */
export function money(n: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Math.abs(n));
}

/** Signed PKR with the ₨ symbol: -530 -> "−530", 3320 -> "₨ 3,320". */
export function pkr(n: number, opts?: { sign?: boolean }): string {
  const abs = money(n);
  if (opts?.sign && n < 0) return `−${abs}`;
  return `₨ ${abs}`;
}

/** Fixed-decimal cost value: 380 -> "380.00". */
export function cost(n: number): string {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Seconds -> "MM:SS", rolling into "H:MM:SS" past an hour: 134 -> "02:14". */
export function duration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const ss = (s % 60).toString().padStart(2, '0');
  const totalMinutes = Math.floor(s / 60);
  // Minutes are capped at 60 rather than left unbounded: a ticket left overnight
  // printed "1513:06", which reads as a broken clock rather than a very late order —
  // exactly the moment the number matters most.
  if (totalMinutes < 60) return `${totalMinutes.toString().padStart(2, '0')}:${ss}`;
  const hh = Math.floor(totalMinutes / 60);
  const mm = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** Clock label "20:14:22". */
export function clock(date: Date): string {
  return formatDate(date, 'HH:mm:ss');
}

/** Date label "Thu 16 Jul". */
export function dayLabel(date: Date): string {
  return formatDate(date, 'EEE d MMM');
}
