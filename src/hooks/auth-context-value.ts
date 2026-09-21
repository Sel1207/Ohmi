import { createContext } from 'react';
import type { SignupInput, UpdateProfileInput } from '../services/auth';
import type { User } from '../types';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login(email: string, password: string): Promise<void>;
  signup(input: SignupInput): Promise<void>;
  updateProfile(input: UpdateProfileInput): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
