// Demo login accounts (seeded on first launch). MOCK data only.
export const DEMO_PASSWORD = 'demo1234';

export const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@ohmi.ph' },
  { label: 'Client - Maria Santos', email: 'maria@demo.ph' },
  { label: 'Client - Juan dela Cruz', email: 'juan@demo.ph' },
  { label: 'Designer - Student', email: 'paolo@demo.ph' },
  { label: 'Designer - REE (verified)', email: 'ana@demo.ph' },
  { label: 'Designer - RME (pending)', email: 'ramon@demo.ph' },
  { label: 'PEE Reviewer', email: 'carlo@demo.ph' },
] as const;
