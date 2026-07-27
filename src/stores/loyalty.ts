import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Client-side loyalty ledger (demo). Registers customers by **phone (primary) or
 * email**, and accrues points against every order placed at the cafe (QR) or on
 * the web storefront. Persisted to localStorage so points accumulate across orders
 * in the demo. In production this maps to ERPNext `Loyalty Program` +
 * `Loyalty Point Entry`, keyed by the unique `Customer` (mobile_no / email_id).
 */

/** 1 point per ₨100 spent. */
export const POINTS_PER_RUPEE = 1 / 100;
export const PROGRAM_NAME = 'Naqsha Rewards';

export type LoyaltyCustomer = {
  key: string; // normalized phone or email — the unique id
  name: string;
  phone: string;
  email?: string;
  points: number;
  orders: number;
  totalSpend: number;
  lastChannel: 'cafe' | 'web';
};

export type OrderIdentity = { name: string; phone: string; email?: string };

type LoyaltyState = {
  customers: Record<string, LoyaltyCustomer>;
  /** Accrue points for an order; upserts the customer. Returns points earned + new balance. */
  recordOrder: (id: OrderIdentity, amount: number, channel: 'cafe' | 'web') => { earned: number; balance: number };
  lookup: (phoneOrEmail: string) => LoyaltyCustomer | undefined;
};

/** Phone → digits only; email → lowercased. Empty string if neither is usable. */
export function loyaltyKey(phone?: string, email?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length >= 7) return digits;
  const e = (email ?? '').trim().toLowerCase();
  return e;
}

export function pointsFor(amount: number): number {
  return Math.floor(Math.max(0, amount) * POINTS_PER_RUPEE);
}

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      customers: {},

      recordOrder: (id, amount, channel) => {
        const key = loyaltyKey(id.phone, id.email);
        const earned = pointsFor(amount);
        if (!key) return { earned: 0, balance: 0 };

        const existing = get().customers[key];
        const updated: LoyaltyCustomer = existing
          ? {
              ...existing,
              name: id.name || existing.name,
              email: id.email || existing.email,
              points: existing.points + earned,
              orders: existing.orders + 1,
              totalSpend: existing.totalSpend + amount,
              lastChannel: channel,
            }
          : {
              key,
              name: id.name,
              phone: id.phone,
              email: id.email,
              points: earned,
              orders: 1,
              totalSpend: amount,
              lastChannel: channel,
            };

        set((s) => ({ customers: { ...s.customers, [key]: updated } }));
        return { earned, balance: updated.points };
      },

      lookup: (phoneOrEmail) => {
        const key = loyaltyKey(phoneOrEmail, phoneOrEmail);
        return key ? get().customers[key] : undefined;
      },
    }),
    { name: 'naqsha-loyalty' },
  ),
);
