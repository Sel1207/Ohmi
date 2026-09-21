import type { CSSProperties } from 'react';
import { TIERS, tierBadgeLabel } from '../constants/tiers';
import type { TierId, VerificationStatus } from '../types';

interface Props {
  tier: TierId;
  status?: VerificationStatus;
}

export function TierBadge({ tier, status = 'verified' }: Props) {
  const style = { '--tier': TIERS[tier].color } as CSSProperties;
  return (
    <span className="badge" style={style} title={TIERS[tier].fullName}>
      {tierBadgeLabel(tier, status)}
    </span>
  );
}