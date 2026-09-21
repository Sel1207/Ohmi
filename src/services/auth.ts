import { DEMO_PASSWORD } from '../constants/demo';
import { TIERS } from '../constants/tiers';
import type { Role, TierId, User, VerificationStatus } from '../types';
import { load, remove, save, uid } from './storage';

export type SignupRole = 'client' | 'designer' | 'pee_reviewer';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: SignupRole;
  tier?: TierId;
  prcNumber?: string;
  location?: string;
}

export interface UpdateProfileInput {
  name: string;
  location?: string;
  specialties: string[];
  avatarUrl?: string;
}

/** Swap point: a Supabase implementation only has to satisfy this interface. */
export interface AuthService {
  signup(input: SignupInput): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  listUsers(): Promise<User[]>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<User>;
  setVerification(userId: string, status: VerificationStatus): Promise<User>;
}

// MOCK: passwords are stored in plain text in localStorage. Replace with real auth later.
type StoredUser = User & { password: string };

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

const demoAvatarByUserId: Record<string, string> = {
  u_paolo: '/profile-paolo.svg',
  u_ana: '/profile-ana.svg',
  u_ramon: '/profile-ramon.svg',
  u_carlo: '/profile-carlo.svg',
};

function seedUsers(): StoredUser[] {
  const createdAt = new Date().toISOString();
  const make = (u: Omit<StoredUser, 'password' | 'createdAt'>): StoredUser => ({
    ...u,
    password: DEMO_PASSWORD,
    createdAt,
  });
  // PRC numbers below are FAKE demo values.
  return [
    make({ id: 'u_admin', name: 'Ohmi Admin', email: 'admin@ohmi.ph', role: 'admin', verification: 'verified', specialties: [] }),
    make({ id: 'u_maria', name: 'Maria Santos', email: 'maria@demo.ph', role: 'client', verification: 'verified', location: 'Quezon City', specialties: [] }),
    make({ id: 'u_juan', name: 'Juan dela Cruz', email: 'juan@demo.ph', role: 'client', verification: 'verified', location: 'Cebu City', specialties: [] }),
    make({ id: 'u_paolo', name: 'Paolo Reyes', email: 'paolo@demo.ph', role: 'designer', tier: 'student', avatarUrl: '/profile-paolo.svg', verification: 'verified', location: 'Manila', specialties: ['Residential wiring'] }),
    make({ id: 'u_ana', name: 'Engr. Ana Villanueva', email: 'ana@demo.ph', role: 'designer', tier: 'ree', avatarUrl: '/profile-ana.svg', prcNumber: '0012345', verification: 'verified', location: 'Makati', specialties: ['Commercial', 'Load calculation'] }),
    make({ id: 'u_ramon', name: 'Ramon Bautista', email: 'ramon@demo.ph', role: 'designer', tier: 'rme', avatarUrl: '/profile-ramon.svg', prcNumber: '0004567', verification: 'pending', location: 'Davao City', specialties: ['Installation', 'Maintenance'] }),
    make({ id: 'u_carlo', name: 'Engr. Carlo Mendoza', email: 'carlo@demo.ph', role: 'pee_reviewer', tier: 'pee', avatarUrl: '/profile-carlo.svg', prcNumber: '0000789', verification: 'verified', location: 'Pasig', specialties: ['Plan review', 'Sealing'] }),
    make({ id: 'u_bea', name: 'Engr. Bea Navarro', email: 'bea@demo.ph', role: 'designer', tier: 'ree', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80', prcNumber: '0001122', verification: 'verified', location: 'Taguig', specialties: ['Residential design', 'Lighting'] }),
    make({ id: 'u_nico', name: 'Nico Garcia', email: 'nico@demo.ph', role: 'designer', tier: 'rme', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80', prcNumber: '0002233', verification: 'verified', location: 'Cavite', specialties: ['Installation', 'Panel upgrades'] }),
    make({ id: 'u_liza', name: 'Engr. Liza Ramos', email: 'liza@demo.ph', role: 'pee_reviewer', tier: 'pee', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=320&q=80', prcNumber: '0003344', verification: 'verified', location: 'Pasay', specialties: ['Commercial review', 'Sign and seal'] }),
    make({ id: 'u_omar', name: 'Omar Villanueva', email: 'omar@demo.ph', role: 'designer', tier: 'student', avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=320&q=80', verification: 'verified', location: 'Marikina', specialties: ['Load schedules', 'Site documentation'] }),
  ];
}

function readUsers(): StoredUser[] {
  const existing = load<StoredUser[] | null>(USERS_KEY, null);
  if (existing) {
    const repaired = existing.map((user) =>
      demoAvatarByUserId[user.id] && !user.avatarUrl ? { ...user, avatarUrl: demoAvatarByUserId[user.id] } : user,
    );
    const knownIds = new Set(repaired.map((user) => user.id));
    const missingDemoUsers = seedUsers().filter((user) => !knownIds.has(user.id));
    const complete = [...repaired, ...missingDemoUsers];
    if (missingDemoUsers.length > 0 || repaired.some((user, index) => user !== existing[index])) save(USERS_KEY, complete);
    return complete;
  }
  const seeded = seedUsers();
  save(USERS_KEY, seeded);
  return seeded;
}

function strip(u: StoredUser): User {
  const copy: Partial<StoredUser> = { ...u };
  delete copy.password;
  return copy as User;
}

async function currentUser(): Promise<User | null> {
  const id = load<string | null>(SESSION_KEY, null);
  if (!id) return null;
  const found = readUsers().find((u) => u.id === id);
  return found ? strip(found) : null;
}

export const localAuthService: AuthService = {
  async signup(input) {
    const users = readUsers();
    const email = input.email.trim().toLowerCase();

    if (!input.name.trim()) throw new Error('Name is required.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email.');
    if (input.password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (users.some((u) => u.email === email)) throw new Error('That email is already registered.');

    // PEE reviewers are always PEE tier; only designers pick their own tier.
    const tier: TierId | undefined =
      input.role === 'pee_reviewer' ? 'pee' : input.role === 'designer' ? input.tier : undefined;
    if (input.role === 'designer' && !tier) throw new Error('Choose your license tier.');

    const needsLicense = tier ? TIERS[tier].requiresLicense : false;
    const prc = input.prcNumber?.trim() ?? '';
    if (needsLicense && !/^\d{4,8}$/.test(prc)) {
      throw new Error('Enter a valid PRC license number (digits only).');
    }

    // Licensed tiers start as "pending" until an admin checks the license by hand.
    // Students and clients have nothing to verify.
    const verification: VerificationStatus = needsLicense ? 'pending' : 'verified';

    const user: StoredUser = {
      id: uid('u'),
      name: input.name.trim(),
      email,
      password: input.password,
      role: input.role as Role,
      tier,
      prcNumber: needsLicense ? prc : undefined,
      verification,
      location: input.location?.trim() || undefined,
      specialties: [],
      createdAt: new Date().toISOString(),
    };
    save(USERS_KEY, [...users, user]);
    save(SESSION_KEY, user.id);
    return strip(user);
  },

  async login(email, password) {
    const found = readUsers().find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (!found) throw new Error('Invalid email or password.');
    save(SESSION_KEY, found.id);
    return strip(found);
  },

  async logout() {
    remove(SESSION_KEY);
  },

  getCurrentUser: currentUser,

  async listUsers() {
    return readUsers().map(strip);
  },

  async updateProfile(userId, input) {
    const me = await currentUser();
    if (!me || me.id !== userId) throw new Error('You can only edit your own profile.');
    if (!input.name.trim()) throw new Error('Name is required.');
    const users = readUsers();
    const target = users.find((user) => user.id === userId);
    if (!target) throw new Error('User not found.');
    target.name = input.name.trim();
    target.location = input.location?.trim() || undefined;
    target.specialties = input.specialties.map((item) => item.trim()).filter(Boolean);
    target.avatarUrl = input.avatarUrl?.trim() || undefined;
    save(USERS_KEY, users);
    return strip(target);
  },

  async setVerification(userId, status) {
    // Enforced in the service, not just by hiding the button.
    const me = await currentUser();
    if (me?.role !== 'admin') throw new Error('Only admins can change verification status.');
    const users = readUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found.');
    target.verification = status;
    save(USERS_KEY, users);
    return strip(target);
  },
};