import type { BuildingType, ProjectType } from '../types';

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  mixed_use: 'Mixed-use',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  design_plan: 'Electrical design and plans',
  load_calculation: 'Load calculation',
  sign_seal: 'PEE sign and seal',
  installation: 'Installation support',
  maintenance: 'Maintenance or troubleshooting',
  other: 'Other',
};

export const PROJECT_STATUS_LABELS = {
  new_construction: 'New construction',
  renovation: 'Renovation',
  addition: 'Addition',
} as const;

export const POWER_TYPE_LABELS = {
  single_phase: 'Single-phase',
  three_phase: 'Three-phase',
  not_sure: 'Not sure',
} as const;

export function projectTypeLabel(projectType: ProjectType, other?: string): string {
  return projectType === 'other' && other?.trim() ? other.trim() : PROJECT_TYPE_LABELS[projectType];
}

export const DESIGN_PROJECT_TYPES: ProjectType[] = ['design_plan', 'load_calculation', 'sign_seal'];

export const INTAKE_HELP = {
  kvaRating: {
    label: 'Service rating in KVA',
    help: 'KVA means how much electrical capacity the building needs. If you do not know it yet, check the utility bill, meter request, or ask the building administrator.',
  },
  floorAreaSqm: {
    label: 'Floor area (sqm)',
    help: 'Floor area helps estimate lighting, outlet counts, cable runs, and likely panel size. If unsure, check architectural plans or a lease listing.',
  },
  breakerCount: {
    label: 'Number of breakers',
    help: 'Breakers are the on/off safety switches inside the panel. If unsure, take a clear photo of the existing panel schedule or breaker box.',
  },
  storeys: {
    label: 'Number of storeys',
    help: 'Storeys means how many floors the design needs to serve. This affects risers, panel locations, and cable routes.',
  },
} as const;

export const UNKNOWN_GUIDANCE = 'Choose "I do not know yet" and Ohmi will keep the job post open for clarification.';
