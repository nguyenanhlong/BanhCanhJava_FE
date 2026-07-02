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

export function getVouchersForTier(tier: MembershipTier): Voucher[] {
  const key = `banhcanh_vouchers_${tier.name}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function claimVoucher(tier: MembershipTier): Voucher | null {
  const vouchers = getVouchersForTier(tier);
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

export function useVoucher(tier: MembershipTier, voucherId: string): boolean {
  const vouchers = getVouchersForTier(tier);
  const idx = vouchers.findIndex(v => v.id === voucherId && !v.usedAt);
  if (idx === -1) return false;
  vouchers[idx].usedAt = new Date().toISOString();
  localStorage.setItem(`banhcanh_vouchers_${tier.name}`, JSON.stringify(vouchers));
  return true;
}

export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' đ';
}
