import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../constants/roles';
import ohmiMark from '../assets/ohmi-mark.png';
import { Avatar } from './Avatar';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Adds a hairline shadow to the sticky header once the page has scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // React Router does not reset scroll on navigation, so new pages would open
  // halfway down. Jump to the top on route changes, but leave a fresh load alone.
  useEffect(() => {
    if (location.key !== 'default') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.key]);

  useEffect(() => {
    const closeProfile = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', closeProfile);
    return () => document.removeEventListener('mousedown', closeProfile);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="shell">
      <header className={scrolled ? 'topbar scrolled' : 'topbar'}>
        <NavLink to="/" className="brand" aria-label="Ohmi home">
          <img className="brand-mark" src={ohmiMark} alt="" aria-hidden="true" />
          <span className="brand-name">Ohmi</span>
        </NavLink>

        <nav className="navlinks" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/marketplace">Marketplace</NavLink>
          <NavLink to="/about">About</NavLink>
          {user && (user.role === 'client' || ((user.role === 'designer' || user.role === 'pee_reviewer') && user.verification === 'verified')) ? <NavLink to="/jobs/new">Post a job</NavLink> : null}
          {user ? <NavLink to="/dashboard">Dashboard</NavLink> : null}
        </nav>

        <div className="user-chip" ref={profileRef}>
          {user ? (
            <>
              <button
                className="profile-trigger"
                type="button"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => setProfileOpen((open) => !open)}
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <span className="user-meta">
                  {user.name}
                  <small>{ROLE_LABELS[user.role]}</small>
                </span>
                <span className="profile-chevron" aria-hidden="true">
                  ⌄
                </span>
              </button>
              {profileOpen ? (
                <div className="profile-menu" role="menu">
                  <NavLink to="/profile" role="menuitem" onClick={() => setProfileOpen(false)}>
                    View profile
                  </NavLink>
                  <NavLink to="/messages" role="menuitem" onClick={() => setProfileOpen(false)}>
                    Messages
                  </NavLink>
                  <button className="profile-menu-logout" type="button" role="menuitem" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <NavLink className="btn btn-primary" to="/login">
              Sign in
            </NavLink>
          )}
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <span>&copy; {new Date().getFullYear()} Ohmi</span>
        <span>Prototype: accounts and jobs are stored in this browser only.</span>
      </footer>
    </div>
  );
}