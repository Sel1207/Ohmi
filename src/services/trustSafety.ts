import { load, save } from './storage';

interface Report {
  id: string;
  reporterId: string;
  targetUserId: string;
  reason: string;
  createdAt: string;
}

const REPORTS_KEY = 'trust:reports';
const BLOCKS_KEY = 'trust:blocks';

export const trustSafetyService = {
  isBlocked(userId: string, targetUserId: string): boolean {
    return load<string[]>(BLOCKS_KEY, []).includes(`${userId}:${targetUserId}`);
  },

  toggleBlock(userId: string, targetUserId: string): boolean {
    const blockKey = `${userId}:${targetUserId}`;
    const blocks = load<string[]>(BLOCKS_KEY, []);
    const blocked = blocks.includes(blockKey);
    save(BLOCKS_KEY, blocked ? blocks.filter((item) => item !== blockKey) : [...blocks, blockKey]);
    return !blocked;
  },

  reportUser(reporterId: string, targetUserId: string, reason: string): void {
    const reports = load<Report[]>(REPORTS_KEY, []);
    reports.push({
      id: `report_${Date.now()}`,
      reporterId,
      targetUserId,
      reason,
      createdAt: new Date().toISOString(),
    });
    save(REPORTS_KEY, reports);
  },
};
