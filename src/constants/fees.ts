// All fees are configurable placeholders. Payments are MOCKED.
export const FEES = {
  platformFeeRate: 0.08,          // 8% of each completed project (allowed range below)
  platformFeeMin: 0.05,
  platformFeeMax: 0.1,
  peeReviewFee: 2500,             // PHP per PEE review add-on (placeholder)
  premiumMonthly: 499,            // PHP per month, designer Premium (placeholder)
} as const;

export function platformFee(amount: number): number {
  return Math.round(amount * FEES.platformFeeRate);
}

export function designerPayout(amount: number): number {
  return amount - platformFee(amount);
}