import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services';
import type { User } from '../types';
import { errorMessage } from '../utils/errors';
import { AuthContext } from './auth-context-value';
import type { SignupInput, UpdateProfileInput } from '../services/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUser(await authService.getCurrentUser());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setUser(await authService.login(email, password));
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    setError(null);
    setUser(await authService.signup(input));
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    if (!user) throw new Error('Sign in to edit your profile.');
    setError(null);
    setUser(await authService.updateProfile(user.id, input));
  }, [user]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, signup, updateProfile, logout, refresh }),
    [user, loading, error, login, signup, updateProfile, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
