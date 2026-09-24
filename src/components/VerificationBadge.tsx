import type { VerificationStatus } from '../types';

interface Props {
  status: VerificationStatus;
}

export function VerificationBadge({ status }: Props) {
  if (status !== 'verified') return <span className={`verification-badge ${status}`}>{status}</span>;

  return (
    <span className="verification-badge verified" title="Identity and credentials verified">
      <span aria-hidden="true">✓</span> Verified
    </span>
  );
}
