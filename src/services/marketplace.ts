import { DESIGN_PROJECT_TYPES } from '../constants/marketplace';
import { TIERS } from '../constants/tiers';
import type {
  DesignerProfile,
  DesignerProfileView,
  Job,
  MarketplaceFilters,
  Project,
  ProjectFile,
  ProgressUpdate,
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
  listProposalsForDesigner(designerId: string): Promise<Proposal[]>;
  submitProposal(jobId: string, designerId: string, input: CreateProposalInput): Promise<Proposal>;
  updateProposal(proposalId: string, designerId: string, input: CreateProposalInput): Promise<Proposal>;
  acceptProposal(proposalId: string, clientId: string): Promise<Project>;
  listProjectsForUser(userId: string): Promise<Project[]>;
  getProject(projectId: string): Promise<Project>;
  updateProjectProgress(projectId: string, userId: string, progressPercent: number, report: string): Promise<Project>;
  requestProjectCompletion(projectId: string, designerId: string): Promise<Project>;
  approveProjectCompletion(projectId: string, clientId: string): Promise<Project>;
  listProgressUpdates(projectId: string, userId: string): Promise<ProgressUpdate[]>;
  listProjectFiles(projectId: string): Promise<ProjectFile[]>;
  uploadProjectFile(projectId: string, userId: string, file: Omit<ProjectFile, 'id' | 'projectId' | 'uploadedBy' | 'createdAt'>): Promise<ProjectFile>;
  getProjectInviteLink(projectId: string): string;
  joinProjectByInvite(projectId: string, token: string, userId: string): Promise<Project>;
  rateDesigner(projectId: string, clientId: string, stars: number, comment: string): Promise<Review>;
  listReviewsForDesigner(designerId: string): Promise<Review[]>;
  followDesigner(designerId: string, followerId: string): Promise<void>;
  unfollowDesigner(designerId: string, followerId: string): Promise<void>;
  isFollowingDesigner(designerId: string, followerId: string): Promise<boolean>;
  followerCount(designerId: string): Promise<number>;
  sendMessage(senderId: string, recipientId: string, body: string): Promise<Message>;
  listMessagesForProject(projectId: string, userId: string): Promise<Message[]>;
  sendProjectMessage(projectId: string, senderId: string, body: string): Promise<Message>;
  listMessagesForUser(userId: string): Promise<Message[]>;
}

const PROFILES_KEY = 'marketplace:profiles';
const JOBS_KEY = 'marketplace:jobs';
const PROPOSALS_KEY = 'marketplace:proposals';
const PROJECTS_KEY = 'marketplace:projects';
const REVIEWS_KEY = 'marketplace:reviews';
const FOLLOWS_KEY = 'marketplace:follows';
const MESSAGES_KEY = 'marketplace:messages';
const PROJECT_FILES_KEY = 'marketplace:project-files';
const PROJECT_INVITES_KEY = 'marketplace:project-invites';
const PROGRESS_UPDATES_KEY = 'marketplace:progress-updates';

const seededJobPosterById: Record<string, string> = {
  job_house_cebu: 'u_ramon',
  job_shop_tag: 'u_nico',
  job_house_davao: 'u_carlo',
  job_warehouse_cavite: 'u_bea',
  job_condo_manila: 'u_ana',
};

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
      userId: 'u_maria',
      headline: 'REE for residential electrical layouts and load schedules',
      bio: 'Verified Registered Electrical Engineer focused on coordinated CAD plans, practical load calculations, and clear client handoffs.',
      education: 'Bachelor of Science in Electrical Engineering, Mapua University',
      address: 'Quezon City',
      specialties: ['Residential design', 'Load calculation', 'CAD layouts'],
      location: 'Quezon City',
      projectsUndertaken: 8,
      proposalsSent: 10,
      portfolio: [],
    },
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
    education: [user.educationLevel, user.educationInstitution].filter(Boolean).join(', ') || 'Education details not provided',
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
    panelCount: { unknown: true },
    storeys: { unknown: true },
  };
  return [
    { id: 'job_house_marikina', clientId: 'u_maria', title: 'Two-storey home electrical layout', projectType: 'design_plan', buildingType: 'residential', location: 'Marikina', budgetMin: 18000, budgetMax: 30000, scope: 'Electrical layout and load schedule for a new family home.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_shop_tag', clientId: 'u_nico', title: 'Retail shop lighting upgrade', projectType: 'installation', buildingType: 'commercial', location: 'Taguig', budgetMin: 22000, budgetMax: 38000, scope: 'Replace outdated fixtures and add efficient lighting for a small retail shop.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_office_makati', clientId: 'u_maria', title: 'Office fit-out load study', projectType: 'load_calculation', buildingType: 'commercial', location: 'Makati', budgetMin: 28000, budgetMax: 45000, scope: 'Load study and panel schedule for a 120 sqm office fit-out.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_house_davao', clientId: 'u_carlo', title: 'Residential panel inspection', projectType: 'maintenance', buildingType: 'residential', location: 'Davao City', budgetMin: 9000, budgetMax: 16000, scope: 'Inspect an aging residential panel and provide safety recommendations.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_cafe_pasig', clientId: 'u_maria', title: 'Cafe power distribution plan', projectType: 'design_plan', buildingType: 'commercial', location: 'Pasig', budgetMin: 24000, budgetMax: 42000, scope: 'Coordinate power points, kitchen loads, and panel schedules for a cafe renovation.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_warehouse_cavite', clientId: 'u_bea', title: 'Warehouse preventive maintenance', projectType: 'maintenance', buildingType: 'industrial', location: 'Cavite', budgetMin: 30000, budgetMax: 52000, scope: 'Inspect warehouse distribution panels and prepare a maintenance checklist.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_clinic_pasay', clientId: 'u_maria', title: 'Clinic electrical documentation', projectType: 'other', projectTypeOther: 'Electrical documentation', buildingType: 'commercial', location: 'Pasay', budgetMin: 15000, budgetMax: 26000, scope: 'Document existing circuits and prepare a clear handover pack for a clinic.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_condo_manila', clientId: 'u_ana', title: 'Condo unit load calculation', projectType: 'load_calculation', buildingType: 'residential', location: 'Manila', budgetMin: 12000, budgetMax: 22000, scope: 'Calculate connected loads for a compact condo renovation.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_lighting_cad_makati', clientId: 'u_bea', title: 'Lighting layout plan in CAD', projectType: 'design_plan', buildingType: 'commercial', location: 'Makati', budgetMin: 26000, budgetMax: 48000, scope: 'Create a coordinated lighting layout in CAD for a boutique office, including fixture schedules and switching zones.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_power_layout_qc', clientId: 'u_ana', title: 'Power layout plan for retail fit-out', projectType: 'design_plan', buildingType: 'commercial', location: 'Quezon City', budgetMin: 30000, budgetMax: 55000, scope: 'Prepare a CAD power layout for receptacles, dedicated equipment, and panel connections in a retail fit-out.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_residential_cad_manila', clientId: 'u_paolo', title: 'Residential electrical CAD drafting', projectType: 'design_plan', buildingType: 'residential', location: 'Manila', budgetMin: 14000, budgetMax: 24000, scope: 'Draft a clean residential lighting and power plan from the architectural floor plan for supervised design review.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_panel_schedule_pasig', clientId: 'u_carlo', title: 'Panel schedule and single-line diagram', projectType: 'load_calculation', buildingType: 'commercial', location: 'Pasig', budgetMin: 22000, budgetMax: 40000, scope: 'Develop a panel schedule and single-line diagram for a small commercial renovation package.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_warehouse_power_cavite', clientId: 'u_nico', title: 'Warehouse power distribution layout', projectType: 'design_plan', buildingType: 'industrial', location: 'Cavite', budgetMin: 42000, budgetMax: 70000, scope: 'Lay out feeders, equipment connections, and distribution panels for a warehouse power upgrade.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_house_lighting_davao', clientId: 'u_ramon', title: 'House lighting and load schedule', projectType: 'load_calculation', buildingType: 'residential', location: 'Davao City', budgetMin: 16000, budgetMax: 28000, scope: 'Prepare a lighting load schedule and practical circuit recommendations for a two-storey home renovation.', intake, status: 'open', createdAt: seededAt },
    { id: 'job_maria_collaboration', clientId: 'u_maria', title: 'Cafe fit-out collaboration package', projectType: 'design_plan', buildingType: 'commercial', location: 'Quezon City', budgetMin: 36000, budgetMax: 58000, scope: 'Coordinate a lighting layout, power plan, and load schedule for a cafe fit-out with a shared review workspace.', intake, status: 'assigned', acceptedProposalId: 'prop_maria_collaboration', createdAt: seededAt },
    { id: 'job_maria_ree_winner', clientId: 'u_bea', title: 'Residential lighting and power CAD package', projectType: 'design_plan', buildingType: 'residential', location: 'Taguig', budgetMin: 28000, budgetMax: 46000, scope: 'Prepare coordinated CAD lighting and power layouts, circuit schedules, and a client-ready electrical plan package.', intake, status: 'assigned', acceptedProposalId: 'prop_maria_ree_winner', createdAt: seededAt },
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
        panelCount: { unknown: true },
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
        panelCount: { unknown: true },
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
    {
      id: 'prop_carlo_cafe',
      jobId: 'job_cafe_qc',
      designerId: 'u_carlo',
      price: 52500,
      timelineDays: 16,
      message: 'I can review the cafe electrical plans, prepare the load schedule and single-line diagram, and coordinate the package for sign-and-seal readiness.',
      status: 'pending',
      createdAt: '2026-09-21T05:10:00.000Z',
    },
    {
      id: 'prop_maria_collaboration',
      jobId: 'job_maria_collaboration',
      designerId: 'u_ana',
      price: 46500,
      timelineDays: 14,
      message: 'I will prepare the coordinated lighting and power layouts, load schedule, and review-ready CAD package.',
      status: 'accepted',
      createdAt: seededAt,
    },
    {
      id: 'prop_maria_ree_winner',
      jobId: 'job_maria_ree_winner',
      designerId: 'u_maria',
      price: 38500,
      timelineDays: 12,
      message: 'I will deliver the lighting and power CAD layouts, circuit schedules, and a coordinated electrical plan package for review.',
      status: 'accepted',
      createdAt: seededAt,
    },
  ];
}

function seededProjects(): Project[] {
  return [
    {
      id: 'proj_maria_collaboration',
      jobId: 'job_maria_collaboration',
      proposalId: 'prop_maria_collaboration',
      clientId: 'u_maria',
      designerId: 'u_ana',
      title: 'Cafe fit-out collaboration package',
      status: 'active',
      collaboratorIds: ['u_bea', 'u_carlo'],
      progressPercent: 42,
      createdAt: seededAt,
    },
    {
      id: 'proj_maria_ree_winner',
      jobId: 'job_maria_ree_winner',
      proposalId: 'prop_maria_ree_winner',
      clientId: 'u_bea',
      designerId: 'u_maria',
      title: 'Residential lighting and power CAD package',
      status: 'active',
      progressPercent: 18,
      createdAt: seededAt,
    },
  ];
}

function seededReviews(): Review[] {
  return [
    {
      id: 'rev_paolo_1', projectId: 'seed_paolo_1', designerId: 'u_paolo', clientId: 'u_juan', stars: 5,
      comment: 'Careful site notes and a very clear starter load inventory.', createdAt: '2026-09-18T02:00:00.000Z',
    },
    {
      id: 'rev_paolo_2', projectId: 'seed_paolo_2', designerId: 'u_paolo', clientId: 'u_bea', stars: 4,
      comment: 'Good communication and thoughtful documentation for a small renovation.', createdAt: '2026-09-17T02:00:00.000Z',
    },
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
      id: 'rev_ana_2', projectId: 'seed_ana_2', designerId: 'u_ana', clientId: 'u_bea', stars: 4,
      comment: 'Well-organized plans and a practical load schedule that was easy to review.', createdAt: '2026-09-19T02:00:00.000Z',
    },
    {
      id: 'rev_ramon_1', projectId: 'seed_ramon_1', designerId: 'u_ramon', clientId: 'u_juan', stars: 5,
      comment: 'Thorough inspection notes and clear maintenance recommendations.', createdAt: '2026-09-18T05:00:00.000Z',
    },
    {
      id: 'rev_ramon_2', projectId: 'seed_ramon_2', designerId: 'u_ramon', clientId: 'u_maria', stars: 4,
      comment: 'Responsive and practical throughout the panel troubleshooting work.', createdAt: '2026-09-17T05:00:00.000Z',
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
    {
      id: 'rev_carlo_2', projectId: 'seed_carlo_2', designerId: 'u_carlo', clientId: 'u_maria', stars: 5,
      comment: 'Sharp review comments and a strong eye for sign-and-seal readiness.', createdAt: '2026-09-19T05:00:00.000Z',
    },
    {
      id: 'rev_bea_1', projectId: 'seed_bea_1', designerId: 'u_bea', clientId: 'u_juan', stars: 5,
      comment: 'The lighting plan was clear, efficient, and easy for the contractor to follow.', createdAt: '2026-09-18T07:00:00.000Z',
    },
    {
      id: 'rev_bea_2', projectId: 'seed_bea_2', designerId: 'u_bea', clientId: 'u_maria', stars: 4,
      comment: 'Strong residential design instincts and clean client handoffs.', createdAt: '2026-09-17T07:00:00.000Z',
    },
    {
      id: 'rev_nico_1', projectId: 'seed_nico_1', designerId: 'u_nico', clientId: 'u_juan', stars: 5,
      comment: 'Reliable field coordination and useful panel upgrade recommendations.', createdAt: '2026-09-18T08:00:00.000Z',
    },
    {
      id: 'rev_nico_2', projectId: 'seed_nico_2', designerId: 'u_nico', clientId: 'u_bea', stars: 4,
      comment: 'Good installation planning with practical next steps.', createdAt: '2026-09-16T08:00:00.000Z',
    },
    {
      id: 'rev_liza_1', projectId: 'seed_liza_1', designerId: 'u_liza', clientId: 'u_maria', stars: 5,
      comment: 'Detailed commercial review and excellent sign-and-seal coordination.', createdAt: '2026-09-18T09:00:00.000Z',
    },
    {
      id: 'rev_liza_2', projectId: 'seed_liza_2', designerId: 'u_liza', clientId: 'u_juan', stars: 5,
      comment: 'Professional, direct, and very helpful during plan revisions.', createdAt: '2026-09-16T09:00:00.000Z',
    },
    {
      id: 'rev_omar_1', projectId: 'seed_omar_1', designerId: 'u_omar', clientId: 'u_bea', stars: 4,
      comment: 'Strong documentation habits and careful site measurement notes.', createdAt: '2026-09-18T10:00:00.000Z',
    },
    {
      id: 'rev_omar_2', projectId: 'seed_omar_2', designerId: 'u_omar', clientId: 'u_maria', stars: 5,
      comment: 'Very attentive to details and easy to coordinate with.', createdAt: '2026-09-16T10:00:00.000Z',
    },
    {
      id: 'rev_maria_1', projectId: 'seed_maria_1', designerId: 'u_maria', clientId: 'u_bea', stars: 5,
      comment: 'Excellent REE-level coordination and a polished CAD plan package.', createdAt: '2026-09-20T10:00:00.000Z',
    },
    {
      id: 'rev_maria_2', projectId: 'seed_maria_2', designerId: 'u_maria', clientId: 'u_carlo', stars: 5,
      comment: 'Clear electrical layouts, responsive updates, and strong technical judgment.', createdAt: '2026-09-19T10:00:00.000Z',
    },
  ];
}

function seededMessages(): Message[] {
  return [
    {
      id: 'msg_maria_ana_1',
      projectId: 'proj_maria_collaboration',
      senderId: 'u_ana',
      recipientId: 'u_maria',
      body: 'The first lighting and power layout draft is ready for your review. I have also added the initial load schedule.',
      createdAt: '2026-09-21T03:15:00.000Z',
    },
    {
      id: 'msg_maria_ana_2',
      projectId: 'proj_maria_collaboration',
      senderId: 'u_maria',
      recipientId: 'u_ana',
      body: 'Thanks. I will review the fixture locations and confirm the kitchen equipment loads today.',
      createdAt: '2026-09-21T03:40:00.000Z',
    },
    {
      id: 'msg_maria_bea_1',
      projectId: 'proj_maria_collaboration',
      senderId: 'u_bea',
      recipientId: 'u_maria',
      body: 'I joined the workspace and can help check the residential lighting references against the client brief.',
      createdAt: '2026-09-21T04:05:00.000Z',
    },
    {
      id: 'msg_maria_carlo_1',
      projectId: 'proj_maria_collaboration',
      senderId: 'u_maria',
      recipientId: 'u_carlo',
      body: 'Carlo, please review the single-line diagram once Ana uploads the next revision.',
      createdAt: '2026-09-21T04:20:00.000Z',
    },
    {
      id: 'msg_bea_maria_1',
      projectId: 'proj_maria_ree_winner',
      senderId: 'u_bea',
      recipientId: 'u_maria',
      body: 'Maria, please prioritize the living room lighting zones and the dedicated kitchen circuits in the first CAD draft.',
      createdAt: '2026-09-21T04:35:00.000Z',
    },
    {
      id: 'msg_maria_bea_2',
      projectId: 'proj_maria_ree_winner',
      senderId: 'u_maria',
      recipientId: 'u_bea',
      body: 'Understood. I will upload the first coordinated layout and circuit schedule for your review.',
      createdAt: '2026-09-21T04:50:00.000Z',
    },
  ];
}

function seededProgressUpdates(): ProgressUpdateStore {
  return {
    proj_maria_collaboration: [
      {
        id: 'progress_maria_ana_1',
        projectId: 'proj_maria_collaboration',
        progressPercent: 42,
        report: 'Completed the first lighting and power layout draft and added the initial load schedule for review.',
        updatedBy: 'u_ana',
        createdAt: '2026-09-21T03:10:00.000Z',
      },
      {
        id: 'progress_maria_ana_2',
        projectId: 'proj_maria_collaboration',
        progressPercent: 28,
        report: 'Set up the CAD base, coordinated the architectural reference, and marked the main electrical zones.',
        updatedBy: 'u_ana',
        createdAt: '2026-09-21T02:45:00.000Z',
      },
    ],
  };
}

function readProfiles(): DesignerProfile[] {
  const existing = load<DesignerProfile[] | null>(PROFILES_KEY, null);
  if (existing) {
    const knownIds = new Set(existing.map((profile) => profile.userId));
    const missingProfiles = seededProfiles().filter((profile) => !knownIds.has(profile.userId));
    const migrated = existing.map((profile) => profile.userId === 'u_maria'
      ? { ...profile, education: 'Bachelor of Science in Electrical Engineering, Mapua University' }
      : profile);
    const complete = [...migrated, ...missingProfiles];
    if (missingProfiles.length > 0 || migrated.some((profile, index) => profile !== existing[index])) save(PROFILES_KEY, complete);
    return complete;
  }
  const seeded = seededProfiles();
  save(PROFILES_KEY, seeded);
  return seeded;
}

function readJobs(): Job[] {
  const existing = load<Job[] | null>(JOBS_KEY, null);
  if (existing) {
    const migrated = existing.map((job) => seededJobPosterById[job.id] ? { ...job, clientId: seededJobPosterById[job.id] } : job);
    const knownIds = new Set(migrated.map((job) => job.id));
    const missingJobs = seededJobs().filter((job) => !knownIds.has(job.id));
    const complete = [...migrated, ...missingJobs];
    if (missingJobs.length > 0 || migrated.some((job, index) => job !== existing[index])) save(JOBS_KEY, complete);
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
  if (existing) {
    const knownIds = new Set(existing.map((proposal) => proposal.id));
    const missing = seededProposals().filter((proposal) => !knownIds.has(proposal.id));
    const complete = [...existing, ...missing];
    if (missing.length > 0) save(PROPOSALS_KEY, complete);
    return complete;
  }
  const seeded = seededProposals();
  save(PROPOSALS_KEY, seeded);
  return seeded;
}

function writeProposals(proposals: Proposal[]): void {
  save(PROPOSALS_KEY, proposals);
}

function readProjects(): Project[] {
  const existing = load<Project[] | null>(PROJECTS_KEY, null);
  if (existing) {
    const seededById = new Map(seededProjects().map((project) => [project.id, project]));
    const migrated = existing.map((project) => {
      const seeded = seededById.get(project.id);
      if (!seeded) return project;
      return {
        ...project,
        collaboratorIds: project.collaboratorIds ?? seeded.collaboratorIds,
        progressPercent: project.progressPercent ?? seeded.progressPercent,
      };
    });
    const knownIds = new Set(migrated.map((project) => project.id));
    const missing = seededProjects().filter((project) => !knownIds.has(project.id));
    const complete = [...migrated, ...missing];
    if (missing.length > 0 || migrated.some((project, index) => project !== existing[index])) save(PROJECTS_KEY, complete);
    return complete;
  }
  const seeded = seededProjects();
  save(PROJECTS_KEY, seeded);
  return seeded;
}

function writeProjects(projects: Project[]): void {
  save(PROJECTS_KEY, projects);
}

type ProjectFileStore = Record<string, ProjectFile[]>;
type ProgressUpdateStore = Record<string, ProgressUpdate[]>;

function readProjectFiles(): ProjectFileStore {
  return load<ProjectFileStore>(PROJECT_FILES_KEY, {});
}

function writeProjectFiles(files: ProjectFileStore): void {
  save(PROJECT_FILES_KEY, files);
}

function readProgressUpdates(): ProgressUpdateStore {
  const existing = load<ProgressUpdateStore | null>(PROGRESS_UPDATES_KEY, null);
  const seeded = seededProgressUpdates();
  if (!existing) {
    save(PROGRESS_UPDATES_KEY, seeded);
    return seeded;
  }
  const merged = { ...existing };
  let changed = false;
  Object.entries(seeded).forEach(([projectId, updates]) => {
    const knownIds = new Set((merged[projectId] ?? []).map((update) => update.id));
    const missing = updates.filter((update) => !knownIds.has(update.id));
    if (missing.length > 0) {
      merged[projectId] = [...(merged[projectId] ?? []), ...missing];
      changed = true;
    }
  });
  if (changed) save(PROGRESS_UPDATES_KEY, merged);
  return merged;
}

function writeProgressUpdates(updates: ProgressUpdateStore): void {
  save(PROGRESS_UPDATES_KEY, updates);
}

function readReviews(): Review[] {
  const existing = load<Review[] | null>(REVIEWS_KEY, null);
  if (existing) {
    const knownIds = new Set(existing.map((review) => review.id));
    const missing = seededReviews().filter((review) => !knownIds.has(review.id));
    const complete = [...existing, ...missing];
    if (missing.length > 0) save(REVIEWS_KEY, complete);
    return complete;
  }
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
  const existing = load<Message[] | null>(MESSAGES_KEY, null);
  if (existing) {
    const knownIds = new Set(existing.map((message) => message.id));
    const missing = seededMessages().filter((message) => !knownIds.has(message.id));
    const complete = [...existing, ...missing];
    if (missing.length > 0) save(MESSAGES_KEY, complete);
    return complete;
  }
  const seeded = seededMessages();
  save(MESSAGES_KEY, seeded);
  return seeded;
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
    const canPostAsProfessional =
      (client?.role === 'designer' || client?.role === 'pee_reviewer') && client.verification === 'verified';
    if (client?.role !== 'client' && !canPostAsProfessional) {
      throw new Error('Only clients or verified professional accounts can post jobs.');
    }

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

  async listProposalsForDesigner(designerId) {
    return readProposals()
      .filter((proposal) => proposal.designerId === designerId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async submitProposal(jobId, designerId, input) {
    validateProposalInput(input);
    const job = await this.getJob(jobId);
    if (job.status !== 'open') throw new Error('This job is no longer open for proposals.');
    if (job.clientId === designerId) throw new Error('You cannot submit a proposal to your own job.');

    const users = await usersById();
    const designer = users.get(designerId);
    if (!designer || (designer.role !== 'designer' && designer.role !== 'pee_reviewer')) {
      throw new Error('Only designers can submit proposals.');
    }
    if (!designer.tier) throw new Error('A license tier is required before submitting proposals.');
    if (designer.verification !== 'verified') {
      throw new Error('Please wait for an admin to verify your account before taking jobs.');
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

  async updateProposal(proposalId, designerId, input) {
    validateProposalInput(input);
    const proposals = readProposals();
    const proposal = proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error('Proposal not found.');
    if (proposal.designerId !== designerId) throw new Error('You can only edit your own proposals.');
    if (proposal.status !== 'pending') throw new Error('Only pending proposals can be edited.');

    const updated = {
      ...proposal,
      price: Math.round(input.price),
      timelineDays: input.timelineDays,
      message: input.message.trim(),
    };
    writeProposals(proposals.map((item) => (item.id === proposalId ? updated : item)));
    return updated;
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
      .filter((project) => project.clientId === userId || project.designerId === userId || project.collaboratorIds?.includes(userId))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },

  async getProject(projectId) {
    const project = readProjects().find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found.');
    return project;
  },

  async updateProjectProgress(projectId, userId, progressPercent, report) {
    const projects = readProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found.');
    if (project.designerId !== userId) throw new Error('Only the assigned designer can update project progress.');
    if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      throw new Error('Progress must be a whole number from 0 to 100.');
    }
    if (!report.trim()) throw new Error('Add a short report describing what was done.');
    const updated = { ...project, progressPercent };
    writeProjects(projects.map((item) => (item.id === projectId ? updated : item)));
    const progressUpdates = readProgressUpdates();
    const update: ProgressUpdate = {
      id: uid('progress'),
      projectId,
      progressPercent,
      report: report.trim(),
      updatedBy: userId,
      createdAt: new Date().toISOString(),
    };
    progressUpdates[projectId] = [update, ...(progressUpdates[projectId] ?? [])];
    writeProgressUpdates(progressUpdates);
    return updated;
  },

  async listProgressUpdates(projectId, userId) {
    const project = await this.getProject(projectId);
    const isMember = project.clientId === userId || project.designerId === userId || project.collaboratorIds?.includes(userId);
    if (!isMember) throw new Error('Only project members can view progress reports.');
    return readProgressUpdates()[projectId] ?? [];
  },

  async listProjectFiles(projectId) {
    await this.getProject(projectId);
    return readProjectFiles()[projectId] ?? [];
  },

  async uploadProjectFile(projectId, userId, file) {
    const project = await this.getProject(projectId);
    if (project.clientId !== userId && project.designerId !== userId && !project.collaboratorIds?.includes(userId)) {
      throw new Error('Only project members can upload files.');
    }
    if (!file.name.trim()) throw new Error('File name is required.');
    if (file.size > 2 * 1024 * 1024) throw new Error('Files must be 2 MB or smaller.');
    const projectFiles = readProjectFiles();
    const uploaded: ProjectFile = {
      ...file,
      id: uid('file'),
      projectId,
      name: file.name.trim(),
      uploadedBy: userId,
      createdAt: new Date().toISOString(),
    };
    projectFiles[projectId] = [uploaded, ...(projectFiles[projectId] ?? [])];
    writeProjectFiles(projectFiles);
    return uploaded;
  },

  getProjectInviteLink(projectId) {
    const invites = load<Record<string, string>>(PROJECT_INVITES_KEY, {});
    const token = invites[projectId] ?? uid('invite');
    if (!invites[projectId]) save(PROJECT_INVITES_KEY, { ...invites, [projectId]: token });
    const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
    const origin = configuredOrigin || (typeof window === 'undefined' ? '' : window.location.origin);
    return `${origin}/projects/${projectId}?invite=${encodeURIComponent(token)}`;
  },

  async joinProjectByInvite(projectId, token, userId) {
    const project = await this.getProject(projectId);
    const invites = load<Record<string, string>>(PROJECT_INVITES_KEY, {});
    if (!token || invites[projectId] !== token) throw new Error('This project invite link is invalid.');
    if (project.clientId === userId || project.designerId === userId || project.collaboratorIds?.includes(userId)) return project;
    const updated = { ...project, collaboratorIds: [...(project.collaboratorIds ?? []), userId] };
    writeProjects(readProjects().map((item) => (item.id === projectId ? updated : item)));
    return updated;
  },

  async requestProjectCompletion(projectId, designerId) {
    const projects = readProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found.');
    if (project.designerId !== designerId) throw new Error('Only the assigned designer can request completion.');
    if (project.status === 'completed') throw new Error('This project is already completed.');
    const updated = { ...project, completionRequested: true };
    writeProjects(projects.map((item) => (item.id === projectId ? updated : item)));
    return updated;
  },

  async approveProjectCompletion(projectId, clientId) {
    const projects = readProjects();
    const project = projects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found.');
    if (project.clientId !== clientId) throw new Error('Only the client can approve completion.');
    if (!project.completionRequested) throw new Error('The designer has not requested completion yet.');
    const updated = { ...project, status: 'completed' as const, completionRequested: false, progressPercent: 100 };
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

  async listMessagesForProject(projectId, userId) {
    const project = await this.getProject(projectId);
    const isMember = project.clientId === userId || project.designerId === userId || project.collaboratorIds?.includes(userId);
    if (!isMember) throw new Error('Only project members can view this conversation.');
    return readMessages()
      .filter((message) => message.projectId === projectId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  },

  async sendProjectMessage(projectId, senderId, body) {
    const project = await this.getProject(projectId);
    const isMember = project.clientId === senderId || project.designerId === senderId || project.collaboratorIds?.includes(senderId);
    if (!isMember) throw new Error('Only project members can send messages here.');
    if (!body.trim()) throw new Error('Write a message first.');
    const message: Message = {
      id: uid('msg'),
      projectId,
      senderId,
      recipientId: project.clientId,
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
