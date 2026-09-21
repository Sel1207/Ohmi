export type Role = 'client' | 'designer' | 'pee_reviewer' | 'guest' | 'admin';

export type TierId = 'student' | 'rme' | 'ree' | 'pee';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  tier?: TierId;
  prcNumber?: string;
  verification: VerificationStatus;
  location?: string;
  specialties: string[];
  createdAt: string;
}

export type BuildingType = 'residential' | 'commercial' | 'industrial' | 'mixed_use';

export type ProjectType = 'design_plan' | 'load_calculation' | 'sign_seal' | 'installation' | 'maintenance' | 'other';

export type ProjectStage = 'new_construction' | 'renovation' | 'addition';
export type PowerType = 'single_phase' | 'three_phase' | 'not_sure';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  projectType: ProjectType;
}

export interface DesignerProfile {
  userId: string;
  headline: string;
  bio: string;
  education: string;
  address: string;
  specialties: string[];
  location: string;
  projectsUndertaken: number;
  portfolio: PortfolioItem[];
  proposalsSent: number;
}

export interface DesignerProfileView extends DesignerProfile {
  user: User;
  averageRating: number;
  reviewCount: number;
}

export interface IntakeMeasurement {
  value?: number;
  unknown: boolean;
}

export interface JobIntake {
  kvaRating: IntakeMeasurement;
  floorAreaSqm: IntakeMeasurement;
  breakerCount: IntakeMeasurement;
  storeys: IntakeMeasurement;
}

export type JobStatus = 'open' | 'assigned' | 'completed' | 'cancelled';

export interface Job {
  id: string;
  clientId: string;
  title: string;
  projectType: ProjectType;
  projectTypeOther?: string;
  scopeTypes?: ProjectType[];
  projectStatus?: ProjectStage;
  buildingType: BuildingType;
  powerType?: PowerType;
  location: string;
  targetTimeline?: string;
  supportingFiles?: string[];
  budgetMin: number;
  budgetMax: number;
  scope: string;
  intake: JobIntake;
  status: JobStatus;
  acceptedProposalId?: string;
  createdAt: string;
}

export type ProposalStatus = 'pending' | 'accepted' | 'declined';

export interface Proposal {
  id: string;
  jobId: string;
  designerId: string;
  price: number;
  timelineDays: number;
  message: string;
  status: ProposalStatus;
  createdAt: string;
}

export type ProjectStatus = 'active' | 'completed';

export interface Project {
  id: string;
  jobId: string;
  proposalId: string;
  clientId: string;
  designerId: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  designerId: string;
  clientId: string;
  stars: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
}

export interface MarketplaceFilters {
  location?: string;
  tier?: TierId | 'all';
  buildingType?: BuildingType | 'all';
  minBudget?: number;
  maxBudget?: number;
}
