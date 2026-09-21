import { DESIGN_PROJECT_TYPES } from '../constants/marketplace';
import { TIERS } from '../constants/tiers';
import type {
  DesignerProfile,
  DesignerProfileView,
  Job,
  MarketplaceFilters,
  Project,
  Proposal,
  Review,
  Message,
  ProjectType,
  User,
} from '../types';
import { load, save, uid } from './storage';
import { localAuthService } from './auth';

export interface CreateJobInput {
  title: string;
  projectType: Job['projectType'];
  projectTypeOther?: string;
  scopeTypes?: ProjectType[];
  projectStatus: Job['projectStatus'];
  buildingType: Job['buildingType'];
  powerType: Job['powerType'];
  location: string;
  targetTimeline: string;
  supportingFiles: string[];
  budgetMin: number;
  budgetMax: number;
  scope: string;
  intake: Job['intake'];
}

export interface CreateProposalInput {
  price: number;
  timelineDays: number;
  message: string;
}

export interface MarketplaceService {
  listDesignerProfiles(filters?: MarketplaceFilters): Promise<DesignerProfileView[]>;
  getDesignerProfile(userId: string): Promise<DesignerProfileView>;
  listJobs(filters?: MarketplaceFilters): Promise<Job[]>;
  getJob(jobId: string): Promise<Job>;
  createJob(clientId: string, input: CreateJobInput): Promise<Job>;
  listProposalsForJob(jobId: string, viewerId: string): Promise<Proposal[]>;
  submitProposal(jobId: string, designerId: string, input: CreateProposalInput): Promise<Proposal>;
  acceptProposal(proposalId: string, clientId: string): Promise<Project>;
  listProjectsForUser(userId: string): Promise<Project[]>;
  getProject(projectId: string): Promise<Project>;
  completeProject(projectId: string, userId: string): Promise<Project>;
  rateDesigner(projectId: string, clientId: string, stars: number, comment: string): Promise<Review>;
  listReviewsForDesigner(designerId: string): Promise<Review[]>;
  followDesigner(designerId: string, followerId: string): Promise<void>;
  unfollowDesigner(designerId: string, followerId: string): Promise<void>;
  isFollowingDesigner(designerId: string, followerId: string): Promise<boolean>;
  followerCount(designerId: string): Promise<number>;
  sendMessage(senderId: string, recipientId: string, body: string): Promise<Message>;
  listMessagesForUser(userId: string): Promise<Message[]>;
}

const PROFILES_KEY = 'marketplace:profiles';
const JOBS_KEY = 'marketplace:jobs';
const PROPOSALS_KEY = 'marketplace:proposals';
const PROJECTS_KEY = 'marketplace:projects';
const REVIEWS_KEY = 'marketplace:reviews';
const FOLLOWS_KEY = 'marketplace:follows';
const MESSAGES_KEY = 'marketplace:messages';

const seededAt = '2026-09-21T02:00:00.000Z';

const seededAvatarByUserId: Record<string, string> = {
  u_paolo: '/Profiles/Paolo%20Reyes.png',
  u_ana: '/Profiles/Engr.%20Ana%20Villanueva.png',
  u_ramon: '/Profiles/Ramon%20Bautista.png',
  u_carlo: '/Profiles/Engr.%20Carlo%20Mendoza.png',
  u_bea: '/Profiles/Engr.%20Bea%20Navarro.png',
  u_nico: '/Profiles/Nico%20Garcia.png',
  u_liza: '/Profiles/Engr.%20Liza%20Ramos.png',
  u_omar: '/Profiles/Omar%20Villanueva.png',
};

function seededProfiles(): DesignerProfile[] {
  return [
    {
      userId: 'u_paolo',
      headline: 'Residential wiring assistant for small renovations',
      bio: 'Student practitioner building a careful portfolio on compact home improvement jobs under proper supervision.',
      education: 'BS Electrical Engineering, Polytechnic University of the Philippines',
      address: 'Sampaloc, Manila',
      specialties: ['Residential wiring', 'Panel documentation', 'Site measurements'],
      location: 'Manila',
      projectsUndertaken: 3,
      proposalsSent: 3,
      portfolio: [
        {
          id: 'pf_paolo_1',
          title: 'Studio unit load inventory',
          description: 'Mapped outlets and lighting loads for a compact condo renovation.',
          imageUrls: [
            'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80',
          ],
          projectType: 'load_calculation',
        },
      ],
    },
    {
      userId: 'u_ana',
      headline: 'REE for commercial load calculations and plan coordination',
      bio: 'Electrical engineer focused on clear calculation packs, panel schedules, and coordination with architectural drawings.',
      education: 'BS Electrical Engineering, Mapua University',
      address: 'San Lorenzo, Makati',
      specialties: ['Commercial', 'Load calculation', 'Panel schedules'],
      location: 'Makati',
      projectsUndertaken: 19,
      proposalsSent: 19,
      portfolio: [
        {
          id: 'pf_ana_1',
          title: 'Cafe branch electrical plan set',
          description: 'Prepared load schedule, lighting layout, and panel board schedule for fit-out review.',
          imageUrls: [
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
          ],
          projectType: 'design_plan',
        },
        {
          id: 'pf_ana_2',
          title: 'Office fit-out load study',
          description: 'Coordinated HVAC, lighting, and receptacle loads for an office renovation.',
          imageUrls: [
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
          ],
          projectType: 'load_calculation',
        },
      ],
    },
    {
      userId: 'u_ramon',
      headline: 'RME for installation and maintenance work',
      bio: 'Experienced field technician for panel maintenance, troubleshooting, and installation support. Verification pending.',
      education: 'Electrical Engineering Technology, University of Mindanao',
      address: 'Buhangin, Davao City',
      specialties: ['Installation', 'Maintenance', 'Troubleshooting'],
      location: 'Davao City',
      projectsUndertaken: 5,
      proposalsSent: 5,
      portfolio: [
        {
          id: 'pf_ramon_1',
          title: 'Retail panel maintenance',
          description: 'Inspected branch circuits and labeled breakers for a small retail space.',
          imageUrls: [
            'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
          ],
          projectType: 'maintenance',
        },
      ],
    },
    {
      userId: 'u_carlo',
      headline: 'PEE reviewer for sign-and-seal readiness',
      bio: 'Professional Electrical Engineer available for senior review, plan comments, and sealing workflows.',
      education: 'BS Electrical Engineering, University of the Philippines Diliman',
      address: 'Kapitolyo, Pasig',
      specialties: ['Plan review', 'Sealing', 'PEC review'],
      location: 'Pasig',
      projectsUndertaken: 11,
      proposalsSent: 11,
      portfolio: [
        {
          id: 'pf_carlo_1',
          title: 'Mid-rise service entrance review',
          description: 'Reviewed service sizing, grounding notes, and panel schedules before final seal.',
          imageUrls: [
            'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
          ],
          projectType: 'design_plan',
        },
      ],
    },
    {
      userId: 'u_bea', headline: 'REE for residential layouts and lighting plans', bio: 'Electrical engineer focused on practical residential design and clear client handoffs.', education: 'BS Electrical Engineering, De La Salle University', address: 'Bonifacio Global City, Taguig', location: 'Taguig', specialties: ['Residential design', 'Lighting'], projectsUndertaken: 14, proposalsSent: 16, portfolio: [],
    },
    {
      userId: 'u_nico', headline: 'RME for safe installations and panel upgrades', bio: 'Field-focused registered master electrician for installation planning and maintenance work.', education: 'Diploma in Electrical Technology, TUP', address: 'Imus, Cavite', location: 'Cavite', specialties: ['Installation', 'Panel upgrades'], projectsUndertaken: 9, proposalsSent: 12, portfolio: [],
    },
    {
      userId: 'u_liza', headline: 'PEE for commercial review and sign-and-seal coordination', bio: 'Senior reviewer helping project teams resolve technical comments before submission.', education: 'BS Electrical Engineering, University of Santo Tomas', address: 'Newport City, Pasay', location: 'Pasay', specialties: ['Commercial review', 'Sign and seal'], projectsUndertaken: 27, proposalsSent: 22, portfolio: [],
    },
    {
      userId: 'u_omar', headline: 'Student practitioner for load schedules and site documentation', bio: 'Student practitioner building experience through careful documentation and supervised coordination.', education: 'BS Electrical Engineering, National University', address: 'Concepcion Uno, Marikina', location: 'Marikina', specialties: ['Load schedules', 'Site documentation'], projectsUndertaken: 4, proposalsSent: 6, portfolio: [],
    },
  ];
}

function defaultProfileFor(user: User): DesignerProfile {
  return {
    userId: user.id,
    headline: `${user.tier ? user.tier.toUpperCase() : 'EE'} practitioner on Ohmi`,
    bio: 'This profile was created from the local signup flow and can be expanded with portfolio details later.',
    education: 'Education details not provided',
    address: user.location ?? 'Address not provided',
    specialties: user.specialties.length > 0 ? user.specialties : ['Electrical coordination'],
    location: user.location ?? 'Philippines',
    projectsUndertaken: 0,
    portfolio: [],
    proposalsSent: 0,
  };
}

function additionalSeededJobs(): Job[] {
  const intake: Job['intake'] = {
    kvaRating: { unknown: true },
    floorAreaSqm: { unknown: true },
    breakerCount: { unknown: true },
    storeys: { unknown: true },
  };
  return [
    { id: 'job_house_marikina', clientId: 'u_maria', title: 'Two-storey home electrical layout', projectType: 'design_plan', buildingType: 'residential', location: 'Marikina', budgetMin: 18000, budgetMax: 30000, scope: 'Electrical layout and load schedule for a new family home.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_shop_tag', clientId: 'u_juan', title: 'Retail shop lighting upgrade', projectType: 'installation', buildingType: 'commercial', location: 'Taguig', budgetMin: 22000, budgetMax: 38000, scope: 'Replace outdated fixtures and add efficient lighting for a small retail shop.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_office_makati', clientId: 'u_maria', title: 'Office fit-out load study', projectType: 'load_calculation', buildingType: 'commercial', location: 'Makati', budgetMin: 28000, budgetMax: 45000, scope: 'Load study and panel schedule for a 120 sqm office fit-out.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_house_davao', clientId: 'u_juan', title: 'Residential panel inspection', projectType: 'maintenance', buildingType: 'residential', location: 'Davao City', budgetMin: 9000, budgetMax: 16000, scope: 'Inspect an aging residential panel and provide safety recommendations.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_cafe_pasig', clientId: 'u_maria', title: 'Cafe power distribution plan', projectType: 'design_plan', buildingType: 'commercial', location: 'Pasig', budgetMin: 24000, budgetMax: 42000, scope: 'Coordinate power points, kitchen loads, and panel schedules for a cafe renovation.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_warehouse_cavite', clientId: 'u_juan', title: 'Warehouse preventive maintenance', projectType: 'maintenance', buildingType: 'industrial', location: 'Cavite', budgetMin: 30000, budgetMax: 52000, scope: 'Inspect warehouse distribution panels and prepare a maintenance checklist.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_clinic_pasay', clientId: 'u_maria', title: 'Clinic electrical documentation', projectType: 'other', projectTypeOther: 'Electrical documentation', buildingType: 'commercial', location: 'Pasay', budgetMin: 15000, budgetMax: 26000, scope: 'Document existing circuits and prepare a clear handover pack for a clinic.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_condo_manila', clientId: 'u_juan', title: 'Condo unit load calculation', projectType: 'load_calculation', buildingType: 'residential', location: 'Manila', budgetMin: 12000, budgetMax: 22000, scope: 'Calculate connected loads for a compact condo renovation.', intake, status: 'open', createdAt: seededAt },
  ];
}

function seededJobs(): Job[] {
  const baseJobs: Job[] = [
    {
      id: 'job_cafe_qc',
      clientId: 'u_maria',
      title: 'Cafe fit-out electrical plans',
      projectType: 'design_plan',
      buildingType: 'commercial',
      location: 'Quezon City',
      budgetMin: 35000,
      budgetMax: 60000,
      scope: 'Need electrical plans and load schedule for a 70 sqm cafe fit-out before contractor bidding.',
      intake: {
        kvaRating: { value: 45, unknown: false },
        floorAreaSqm: { value: 70, unknown: false },
        breakerCount: { unknown: true },
        storeys: { value: 1, unknown: false },
      },
      status: 'open',
      createdAt: seededAt,
    },
    {
      id: 'job_house_cebu',
      clientId: 'u_juan',
      title: 'Small house panel cleanup',
      projectType: 'maintenance',
      buildingType: 'residential',
      location: 'Cebu City',
      budgetMin: 8000,
      budgetMax: 14000,
      scope: 'Breaker labels are unclear after a renovation. Need inspection, labeling, and safety recommendations.',
      intake: {
        kvaRating: { unknown: true },
        floorAreaSqm: { value: 65, unknown: false },
        breakerCount: { value: 10, unknown: false },
        storeys: { value: 1, unknown: false },
      },
      status: 'open',
      createdAt: seededAt,
    },
  ];
  return baseJobs.concat(additionalSeededJobs());
}

function seededProposals(): Proposal[] {
  return [
    {
      id: 'prop_ana_cafe',
      jobId: 'job_cafe_qc',
      designerId: 'u_ana',
      price: 48000,
      timelineDays: 10,
      message: 'I can prepare load calculations, panel schedule, and permit-ready plan sheets for PEE review.',
      status: 'pending',
      createdAt: seededAt,
    },
  ];
}

function seededReviews(): Review[] {
  return [
    {
      id: 'rev_ana_1',
      projectId: 'seed_completed_1',
      designerId: 'u_ana',
      clientId: 'u_maria',
      stars: 5,
      comment: 'Clear calculations and very responsive during plan coordination.',
      createdAt: seededAt,
    },
    {
      id: 'rev_carlo_1',
      projectId: 'seed_completed_2',
      designerId: 'u_carlo',
      clientId: 'u_juan',
      stars: 5,
      comment: 'Detailed review comments and practical PEC references.',
      createdAt: seededAt,
    },
  ];
}

function readProfiles(): DesignerProfile[] {
  const existing = load<DesignerProfile[] | null>(PROFILES_KEY, null);
  if (existing) {
    const knownIds = new Set(existing.map((profile) => profile.userId));
    const missingProfiles = seededProfiles().filter((profile) => !knownIds.has(profile.userId));
    const complete = [...existing, ...missingProfiles];
    if (missingProfiles.length > 0) save(PROFILES_KEY, complete);
    return complete;
  }
  const seeded = seededProfiles();
  save(PROFILES_KEY, seeded);
  return seeded;
}

function readJobs(): Job[] {
  const existing = load<Job[] | null>(JOBS_KEY, null);
  if (existing) {
    const knownIds = new Set(existing.map((job) => job.id));
    const missingJobs = seededJobs().filter((job) => !knownIds.has(job.id));
    const complete = [...existing, ...missingJobs];
    if (missingJobs.length > 0) save(JOBS_KEY, complete);
    return complete;
  }
  const seeded = seededJobs();
  save(JOBS_KEY, seeded);
  return seeded;
}

function writeJobs(jobs: Job[]): void {
  save(JOBS_KEY, jobs);
}

function readProposals(): Proposal[] {
  const existing = load<Proposal[] | null>(PROPOSALS_KEY, null);
  if (existing) return existing;
  const seeded = seededProposals();
  save(PROPOSALS_KEY, seeded);
  return seeded;
}

function writeProposals(proposals: Proposal[]): void {
  save(PROPOSALS_KEY, proposals);
}

function readProjects(): Project[] {
  return load<Project[]>(PROJECTS_KEY, []);
}

function writeProjects(projects: Project[]): void {
  save(PROJECTS_KEY, projects);
}

function readReviews(): Review[] {
  const existing = load<Review[] | null>(REVIEWS_KEY, null);
  if (existing) return existing;
  const seeded = seededReviews();
  save(REVIEWS_KEY, seeded);
  return seeded;
}

function writeReviews(reviews: Review[]): void {
  save(REVIEWS_KEY, reviews);
}

type FollowStore = Record<string, string[]>;

function readFollows(): FollowStore {
  return load<FollowStore>(FOLLOWS_KEY, {});
}

function writeFollows(follows: FollowStore): void {
  save(FOLLOWS_KEY, follows);
}

function readMessages(): Message[] {
  return load<Message[]>(MESSAGES_KEY, []);
}

function writeMessages(messages: Message[]): void {
  save(MESSAGES_KEY, messages);
}

async function usersById(): Promise<Map<string, User>> {
  const users = await localAuthService.listUsers();
  return new Map(users.map((user) => [user.id, user]));
}

function isDesignWork(job: Job): boolean {
  return DESIGN_PROJECT_TYPES.includes(job.projectType);
}

function numberOrInfinity(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isSmallPracticeJob(job: Job): boolean {
  const kva = numberOrInfinity(job.intake.kvaRating.value, 15);
  const floorArea = numberOrInfinity(job.intake.floorAreaSqm.value, 80);
  const breakers = numberOrInfinity(job.intake.breakerCount.value, 12);
  const storeys = numberOrInfinity(job.intake.storeys.value, 2);

  return job.budgetMax <= 15000 && kva <= 15 && floorArea <= 80 && breakers <= 12 && storeys <= 2;
}

function tierCanTakeJob(tier: User['tier'], job: Job): boolean {
  if (!tier) return false;
  if (tier === 'student') return isSmallPracticeJob(job);
  if (isDesignWork(job)) return TIERS[tier].canDesign;
  return true;
}

function validateJobInput(input: CreateJobInput): void {
  if (!input.title.trim()) throw new Error('Job title is required.');
  if (!input.location.trim()) throw new Error('Location is required.');
  if (!input.scope.trim()) throw new Error('Describe the project scope.');
  if (!Number.isFinite(input.budgetMin) || !Number.isFinite(input.budgetMax)) {
    throw new Error('Enter a valid budget range.');
  }
  if (input.budgetMin < 0 || input.budgetMax < input.budgetMin) {
    throw new Error('Budget max must be greater than or equal to budget min.');
  }
  if (input.projectType === 'other' && !input.projectTypeOther?.trim()) {
    throw new Error('Specify the project type.');
  }
}

function validateProposalInput(input: CreateProposalInput): void {
  if (!Number.isFinite(input.price) || input.price <= 0) throw new Error('Enter a valid proposal price.');
  if (!Number.isInteger(input.timelineDays) || input.timelineDays <= 0) {
    throw new Error('Timeline must be a whole number of days.');
  }
  if (!input.message.trim()) throw new Error('Add a short proposal note.');
}

function ratingFor(reviews: Review[], designerId: string): { averageRating: number; reviewCount: number } {
  const ownReviews = reviews.filter((review) => review.designerId === designerId);
  if (ownReviews.length === 0) return { averageRating: 0, reviewCount: 0 };
  const total = ownReviews.reduce((sum, review) => sum + review.stars, 0);
  return { averageRating: total / ownReviews.length, reviewCount: ownReviews.length };
}

function matchesFilters(job: Job, filters?: MarketplaceFilters): boolean {
  if (!filters) return true;
  const location = filters.location?.trim().toLowerCase();
  if (location && !job.location.toLowerCase().includes(location)) return false;
  if (filters.buildingType && filters.buildingType !== 'all' && job.buildingType !== filters.buildingType) {
    return false;
  }
  if (filters.minBudget && job.budgetMax < filters.minBudget) return false;
  if (filters.maxBudget && job.budgetMin > filters.maxBudget) return false;
  if (filters.tier && filters.tier !== 'all' && !tierCanTakeJob(filters.tier, job)) return false;
  return true;
}

export const localMarketplaceService: MarketplaceService = {
  async listDesignerProfiles(filters) {
    const users = await usersById();
    const reviews = readReviews();
    const storedProfiles = readProfiles();
    const profileByUserId = new Map(storedProfiles.map((profile) => [profile.userId, profile]));
    const profileUsers = [...users.values()].filter(
      (user) => user.role === 'designer' || user.role === 'pee_reviewer',
    );

    return profileUsers
      .map((user) => profileByUserId.get(user.id) ?? defaultProfileFor(user))
      .map((profile) => {
        const user = users.get(profile.userId);
        if (!user) return null;
        const rating = ratingFor(reviews, profile.userId);
        const profileUser: User = { ...user, avatarUrl: user.avatarUrl ?? seededAvatarByUserId[user.id] };
        return { ...profile, user: profileUser, ...rating };
      })
      .filter((profile): profile is DesignerProfileView => {
        if (!profile) return false;
        const location = filters?.location?.trim().toLowerCase();
        if (location && !profile.location.toLowerCase().includes(location)) return false;
        if (filters?.tier && filters.tier !== 'all' && profile.user.tier !== filters.tier) return false;
        return true;
      });
  },

  async getDesignerProfile(userId) {
    const profile = (await this.listDesignerProfiles()).find((item) => item.userId === userId);
    if (!profile) throw new Error('Designer profile not found.');
    return profile;
  },

  async listJobs(filters) {
    return readJobs()
      .filter((job) => matchesFilters(job, filters))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async getJob(jobId) {
    const job = readJobs().find((item) => item.id === jobId);
    if (!job) throw new Error('Job not found.');
    return job;
  },

  async createJob(clientId, input) {
    validateJobInput(input);
    const users = await usersById();
    const client = users.get(clientId);
    if (client?.role !== 'client') throw new Error('Only clients can post jobs.');

    const job: Job = {
      id: uid('job'),
      clientId,
      title: input.title.trim(),
      projectType: input.projectType,
      projectTypeOther: input.projectTypeOther?.trim() || undefined,
      scopeTypes: input.scopeTypes,
      projectStatus: input.projectStatus,
      buildingType: input.buildingType,
      powerType: input.powerType,
      location: input.location.trim(),
      targetTimeline: input.targetTimeline.trim(),
      supportingFiles: input.supportingFiles,
      budgetMin: Math.round(input.budgetMin),
      budgetMax: Math.round(input.budgetMax),
      scope: input.scope.trim(),
      intake: input.intake,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    writeJobs([job, ...readJobs()]);
    return job;
  },

  async listProposalsForJob(jobId, viewerId) {
    const job = await this.getJob(jobId);
    if (job.clientId !== viewerId) {
      throw new Error('Only the client who posted this job can view its proposals.');
    }
    return readProposals()
      .filter((proposal) => proposal.jobId === jobId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async submitProposal(jobId, designerId, input) {
    validateProposalInput(input);
    const job = await this.getJob(jobId);
    if (job.status !== 'open') throw new Error('This job is no longer open for proposals.');

    const users = await usersById();
    const designer = users.get(designerId);
    if (!designer || (designer.role !== 'designer' && designer.role !== 'pee_reviewer')) {
      throw new Error('Only designers can submit proposals.');
    }
    if (!designer.tier) throw new Error('A license tier is required before submitting proposals.');
    if (TIERS[designer.tier].requiresLicense && designer.verification !== 'verified') {
      throw new Error('PRC verification must be approved before submitting proposals.');
    }
    if (isDesignWork(job) && !TIERS[designer.tier].canDesign) {
      throw new Error('RMEs cannot submit design proposals. They may bid on installation or maintenance work.');
    }
    if (designer.tier === 'student' && !isSmallPracticeJob(job)) {
      throw new Error('Student practitioners can only submit proposals for small practice jobs.');
    }

    const proposals = readProposals();
    if (proposals.some((proposal) => proposal.jobId === jobId && proposal.designerId === designerId)) {
      throw new Error('You already submitted a proposal for this job.');
    }

    const proposal: Proposal = {
      id: uid('prop'),
      jobId,
      designerId,
      price: Math.round(input.price),
      timelineDays: input.timelineDays,
      message: input.message.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    writeProposals([proposal, ...proposals]);
    return proposal;
  },

  async acceptProposal(proposalId, clientId) {
    const proposals = readProposals();
    const proposal = proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error('Proposal not found.');
    if (proposal.status !== 'pending') throw new Error('Only pending proposals can be accepted.');

    const jobs = readJobs();
    const job = jobs.find((item) => item.id === proposal.jobId);
    if (!job) throw new Error('Job not found.');
    if (job.clientId !== clientId) throw new Error('Only the client who posted this job can accept proposals.');
    if (job.status !== 'open') throw new Error('This job already has an accepted proposal.');

    const project: Project = {
      id: uid('proj'),
      jobId: job.id,
      proposalId: proposal.id,
      clientId: job.clientId,
      designerId: proposal.designerId,
      title: job.title,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    writeProjects([project, ...readProjects()]);
    writeJobs(
      jobs.map((item) =>
        item.id === job.id ? { ...item, status: 'assigned', acceptedProposalId: proposal.id } : item,
      ),
    );
    writeProposals(
      proposals.map((item) => {
        if (item.id === proposal.id) return { ...item, status: 'accepted' };
        if (item.jobId === job.id) return { ...item, status: 'declined' };
        return item;
      }),
    );
    return project;
  },

  async listProjectsForUser(userId) {
    return readProjects()
      .filter((project) => project.clientId === userId || project.designerId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async getProject(projectId) {
    const project = readProjects().find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found.');
    return project;
  },

  async completeProject(projectId, userId) {
    const projects = readProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found.');
    if (project.clientId !== userId && project.designerId !== userId) {
      throw new Error('Only project members can mark this Phase 2 project complete.');
    }
    const updated = { ...project, status: 'completed' as const };
    writeProjects(projects.map((item) => (item.id === projectId ? updated : item)));
    return updated;
  },

  async rateDesigner(projectId, clientId, stars, comment) {
    const project = await this.getProject(projectId);
    if (project.clientId !== clientId) throw new Error('Only the client can rate the designer.');
    if (project.status !== 'completed') throw new Error('Ratings open after the project is marked completed.');
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('Choose a rating from 1 to 5 stars.');
    if (!comment.trim()) throw new Error('Add a short review comment.');

    const reviews = readReviews();
    if (reviews.some((review) => review.projectId === projectId && review.clientId === clientId)) {
      throw new Error('You already reviewed this project.');
    }

    const review: Review = {
      id: uid('rev'),
      projectId,
      designerId: project.designerId,
      clientId,
      stars,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    writeReviews([review, ...reviews]);
    return review;
  },

  async listReviewsForDesigner(designerId) {
    return readReviews()
      .filter((review) => review.designerId === designerId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async followDesigner(designerId, followerId) {
    if (designerId === followerId) throw new Error('You cannot follow your own profile.');
    await this.getDesignerProfile(designerId);
    const follows = readFollows();
    const followers = follows[designerId] ?? [];
    if (!followers.includes(followerId)) {
      writeFollows({ ...follows, [designerId]: [...followers, followerId] });
    }
  },

  async unfollowDesigner(designerId, followerId) {
    const follows = readFollows();
    writeFollows({
      ...follows,
      [designerId]: (follows[designerId] ?? []).filter((id) => id !== followerId),
    });
  },

  async isFollowingDesigner(designerId, followerId) {
    return (readFollows()[designerId] ?? []).includes(followerId);
  },

  async followerCount(designerId) {
    return (readFollows()[designerId] ?? []).length;
  },

  async sendMessage(senderId, recipientId, body) {
    if (senderId === recipientId) throw new Error('You cannot message yourself.');
    if (!body.trim()) throw new Error('Write a message first.');
    await this.getDesignerProfile(recipientId);
    const message: Message = {
      id: uid('msg'),
      senderId,
      recipientId,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    writeMessages([message, ...readMessages()]);
    return message;
  },

  async listMessagesForUser(userId) {
    return readMessages()
      .filter((message) => message.senderId === userId || message.recipientId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },
};
