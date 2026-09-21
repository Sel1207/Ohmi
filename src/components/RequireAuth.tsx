import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

interface Props {
  children: ReactNode;
  roles?: Role[];
}

export function RequireAuth({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="page">
        <div className="card">Loading your Ohmi session...</div>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <main className="page">
        <div className="card empty-state">
          <h1>Access is limited</h1>
          <p>This workspace is available to {roles.join(', ')} accounts.</p>
        </div>
      </main>
    );
  }

  return children;
}
