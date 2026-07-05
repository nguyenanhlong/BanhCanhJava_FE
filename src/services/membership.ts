export interface MembershipTier {
  id: number;
  name: 'member' | 'loyal' | 'vip';
  displayName: string;
  minTotalSpent: number;
  minTotalOrders: number;
  autoDiscountPercent: number;
  voucherCount: number;
  voucherDiscountPercent: number;
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  { id: 1, name: 'member', displayName: 'Thành viên', minTotalSpent: 0, minTotalOrders: 0, autoDiscountPercent: 0, voucherCount: 0, voucherDiscountPercent: 0 },
  { id: 2, name: 'loyal', displayName: 'Thân thiết', minTotalSpent: 2000000, minTotalOrders: 10, autoDiscountPercent: 3, voucherCount: 2, voucherDiscountPercent: 10 },
  { id: 3, name: 'vip', displayName: 'VIP', minTotalSpent: 10000000, minTotalOrders: 50, autoDiscountPercent: 7, voucherCount: 4, voucherDiscountPercent: 15 },
];

import { ApiService } from './api';
import { MembershipVoucher } from '../types';

export interface Voucher {
  id: string;
  code: string;
  discountPercent: number;
  maxDiscount: number;
  claimedAt: string;
  usedAt?: string;
  expiredAt: string;
}

export function getUserTier(totalSpent: number, totalOrders: number): MembershipTier {
  if (totalSpent >= 10000000 && totalOrders >= 50) return MEMBERSHIP_TIERS[2];
  if (totalSpent >= 2000000 && totalOrders >= 10) return MEMBERSHIP_TIERS[1];
  return MEMBERSHIP_TIERS[0];
}

export function calculateAutoDiscount(tier: MembershipTier, totalAmount: number): number {
  return Math.round(totalAmount * tier.autoDiscountPercent / 100);
}

export async function getVouchersForTier(tier: MembershipTier, userId?: number): Promise<Voucher[]> {
  if (userId) {
    try {
      const apiVouchers = await ApiService.getVouchers(userId);
      return apiVouchers
        .filter(v => v.tierId === tier.id)
        .map(v => ({
          id: String(v.id),
          code: v.code,
          discountPercent: v.discountPercent,
          maxDiscount: v.maxDiscount,
          claimedAt: v.issuedAt,
          usedAt: v.usedAt,
          expiredAt: v.expiresAt,
        }));
    } catch {}
  }
  const key = `banhcanh_vouchers_${tier.name}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export async function claimVoucher(tier: MembershipTier, userId?: number): Promise<Voucher | null> {
  if (userId) {
    try {
      const result = await ApiService.claimVoucher(userId, tier.id);
      return {
        id: String(result.id),
        code: result.code,
        discountPercent: result.discountPercent,
        maxDiscount: result.maxDiscount,
        claimedAt: result.issuedAt,
        usedAt: result.usedAt,
        expiredAt: result.expiresAt,
      };
    } catch {}
  }
  const vouchers = await getVouchersForTier(tier, userId);
  const available = tier.voucherCount - vouchers.filter(v => !v.usedAt).length;
  if (available <= 0) return null;

  const code = `VOUCHER_${tier.name.toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;
  const voucher: Voucher = {
    id: Date.now().toString(36),
    code,
    discountPercent: tier.voucherDiscountPercent,
    maxDiscount: tier.name === 'vip' ? 100000 : 50000,
    claimedAt: new Date().toISOString(),
    expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  vouchers.push(voucher);
  localStorage.setItem(`banhcanh_vouchers_${tier.name}`, JSON.stringify(vouchers));
  return voucher;
}

export async function useVoucher(tier: MembershipTier, voucherId: string, userId?: number): Promise<boolean> {
  if (userId) {
    try {
      await ApiService.useVoucher(Number(voucherId));
      return true;
    } catch {}
  }
  const vouchers = await getVouchersForTier(tier, userId);
  const idx = vouchers.findIndex(v => v.id === voucherId && !v.usedAt);
  if (idx === -1) return false;
  vouchers[idx].usedAt = new Date().toISOString();
  localStorage.setItem(`banhcanh_vouchers_${tier.name}`, JSON.stringify(vouchers));
  return true;
}

export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' đ';
}
