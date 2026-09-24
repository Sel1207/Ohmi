import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../constants/roles';
import ohmiMark from '../assets/ohmi-mark.png';
import { Avatar } from './Avatar';
import { marketplaceService } from '../services';

interface HeaderNotification {
  id: string;
  title: string;
  body: string;
  to: string;
  createdAt: string;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
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

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      const [messages, projects, proposals, jobs] = await Promise.all([
        marketplaceService.listMessagesForUser(user.id),
        marketplaceService.listProjectsForUser(user.id),
        user.role === 'designer' || user.role === 'pee_reviewer' ? marketplaceService.listProposalsForDesigner(user.id) : Promise.resolve([]),
        marketplaceService.listJobs(),
      ]);
      const projectByProposalId = new Map(projects.map((project) => [project.proposalId, project]));
      const nextNotifications: HeaderNotification[] = [
        ...messages
          .filter((message) => message.recipientId === user.id)
          .map((message) => ({
            id: message.id,
            title: message.projectId ? 'New project message' : 'New message',
            body: message.body,
            to: message.projectId ? `/projects/${message.projectId}#project-conversation` : '/messages',
            createdAt: message.createdAt,
          })),
        ...projects.map((project) => ({
          id: `project-${project.id}`,
          title: 'Project accepted',
          body: `${project.title} is now ready for collaboration.`,
          to: `/projects/${project.id}#project-conversation`,
          createdAt: project.createdAt,
        })),
        ...proposals
          .filter((proposal) => proposal.status !== 'pending')
          .map((proposal) => {
            const project = projectByProposalId.get(proposal.id);
            return {
              id: `proposal-${proposal.id}`,
              title: proposal.status === 'accepted' ? 'Proposal accepted' : 'Proposal declined',
              body: proposal.status === 'accepted' ? 'Your proposal was accepted.' : 'Your proposal was declined.',
              to: project ? `/projects/${project.id}#project-conversation` : `/jobs/${proposal.jobId}`,
              createdAt: proposal.createdAt,
            };
          }),
        ...jobs
          .filter((job) => job.clientId === user.id && job.status === 'assigned')
          .map((job) => ({
            id: `job-${job.id}`,
            title: 'Job assigned',
            body: `${job.title} has been assigned to a designer.`,
            to: `/jobs/${job.id}`,
            createdAt: job.createdAt,
          })),
      ];
      setNotifications(nextNotifications.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8));
    };

    void loadNotifications();
  }, [user]);

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
                className="notification-button"
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                aria-haspopup="menu"
                title="Notifications"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <span className="notification-icon" aria-hidden="true">&#128276;&#xfe0e;</span>
                {notifications.length > 0 ? <span className="notification-dot" aria-hidden="true" /> : null}
              </button>
              {notificationsOpen ? (
                <div className="notification-menu" role="menu" aria-label="Notifications">
                  <div className="notification-heading">
                    <strong>Notifications</strong>
                    <span>{notifications.length}</span>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="notification-empty">No new notifications.</p>
                  ) : (
                    notifications.map((notification) => (
                      <NavLink
                        className="notification-item"
                        key={notification.id}
                        to={notification.to}
                        role="menuitem"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <strong>{notification.title}</strong>
                        <span>{notification.body}</span>
                      </NavLink>
                    ))
                  )}
                  <NavLink className="notification-footer" to="/dashboard" onClick={() => setNotificationsOpen(false)}>
                    View more activity
                  </NavLink>
                </div>
              ) : null}
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