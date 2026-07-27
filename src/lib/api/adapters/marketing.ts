import type { Campaign, Coupon } from '@/types/erp';
import type { SrvCampaign, SrvCoupon } from '@/types/server';
import { dayShort, opt, whenLabel } from './shared';

/**
 * Campaign scheduling reads as one of three sentences, never a bare date: "Sent ·
 * Today 12:00" and "Today · 12:00" mean different things to whoever is deciding
 * whether to press send.
 */
function scheduleLabel(raw: SrvCampaign): string {
  if (raw.status === 'sent') return raw.sentAt ? `Sent · ${whenLabel(raw.sentAt)}` : 'Sent';
  if (raw.scheduledAt) return whenLabel(raw.scheduledAt);
  return 'Not scheduled';
}

export function toCampaign(raw: SrvCampaign): Campaign {
  return {
    id: raw.id,
    name: raw.name,
    channel: raw.channel,
    audience: raw.audience,
    audienceLabel: raw.audienceLabel,
    reach: raw.reach,
    status: raw.status,
    scheduledLabel: scheduleLabel(raw),
    scheduledAt: opt(raw.scheduledAt),
  };
}

export function toCoupon(raw: SrvCoupon): Coupon {
  return {
    ref: raw.ref,
    // A Coupon Code with no code is unusable, but it should still render as a row a
    // manager can see and fix rather than vanish from the list.
    code: raw.code ?? '—',
    name: raw.name,
    description: raw.description ?? raw.name,
    discountLabel: raw.discountLabel,
    used: raw.used ?? 0,
    limit: raw.limit ?? 0,
    validUptoLabel: raw.validUpto ? dayShort(raw.validUpto) : 'No end date',
    validUpto: opt(raw.validUpto),
    status: raw.status,
  };
}
