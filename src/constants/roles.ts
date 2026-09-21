import type { Role } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  client: 'Client',
  designer: 'Designer',
  pee_reviewer: 'PEE Reviewer',
  guest: 'Guest Collaborator',
  admin: 'Admin',
};