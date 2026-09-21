import type { TierId, VerificationStatus } from '../types';

export interface TierInfo {
  id: TierId;
  label: string;
  fullName: string;
  color: string;
  requiresLicense: boolean;
  canDesign: boolean;
  canSeal: boolean;
  summary: string;
}

export const TIERS: Record<TierId, TierInfo> = {
  student: {
    id: 'student',
    label: 'Student Practitioner',
    fullName: 'Student Practitioner',
    color: '#64748B',
    requiresLicense: false,
    canDesign: true,
    canSeal: false,
    summary: 'Unlicensed. Builds a portfolio on small/practice jobs. Cannot sign or seal plans.',
  },
  rme: {
    id: 'rme',
    label: 'RME',
    fullName: 'Registered Master Electrician',
    color: '#0D9488',
    requiresLicense: true,
    canDesign: false,
    canSeal: false,
    summary: 'Installs and maintains wiring. No design or sealing authority.',
  },
  ree: {
    id: 'ree',
    label: 'REE',
    fullName: 'Registered Electrical Engineer',
    color: '#7C3AED',
    requiresLicense: true,
    canDesign: true,
    canSeal: false,
    summary: 'Designs and computes electrical plans. Cannot seal them.',
  },
  pee: {
    id: 'pee',
    label: 'PEE',
    fullName: 'Professional Electrical Engineer',
    color: '#D97706',
    requiresLicense: true,
    canDesign: true,
    canSeal: true,
    summary: 'Senior tier. The only tier with legal authority to seal plans.',
  },
};

export const TIER_ORDER: TierId[] = ['student', 'rme', 'ree', 'pee'];

/** Single source of truth for sealing authority. The service layer must use this. */
export function canSeal(tier: TierId | undefined): boolean {
  return tier ? TIERS[tier].canSeal : false;
}

/** Exact badge text, e.g. "PRC-verified REE". Never a vague "Verified". */
export function tierBadgeLabel(tier: TierId, status: VerificationStatus = 'verified'): string {
  const info = TIERS[tier];
  if (tier === 'student') return 'Student Practitioner';
  if (status === 'verified') return `PRC-verified ${info.label}`;
  if (status === 'pending') return `${info.label} - Pending verification`;
  return `${info.label} - Verification rejected`;
}
