import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { TierBadge } from '../components/TierBadge';
import { ROLE_LABELS } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';
import { marketplaceService } from '../services';
import type { DesignerProfileView } from '../types';
import { projectTypeLabel } from '../constants/marketplace';

export function Profile() {
  const { user } = useAuth();
  const [designerProfile, setDesignerProfile] = useState<DesignerProfileView | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'designer' && user.role !== 'pee_reviewer')) return;
    void marketplaceService.getDesignerProfile(user.id).then(setDesignerProfile).catch(() => setDesignerProfile(null));
  }, [user]);

  if (!user) return null;

  return (
    <main className="page narrow-page">
      <section className="page-heading profile-heading">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" />
        <div>
          <p className="eyebrow">{ROLE_LABELS[user.role]}</p>
          <h1>{user.name}</h1>
          <p className="muted">{user.email}</p>
        </div>
      </section>

      <section className="card stack">
        <div className="section-title">
          <h2>Profile details</h2>
          <Link className="btn btn-secondary" to="/profile/edit">
            Edit profile
          </Link>
        </div>
        <div className="meta-row">
          <span>{designerProfile?.address ?? user.location ?? 'No location added'}</span>
          {user.tier ? <TierBadge tier={user.tier} status={user.verification} /> : null}
          {designerProfile ? <span>{designerProfile.projectsUndertaken} projects undertaken</span> : null}
          {designerProfile ? <span>{designerProfile.proposalsSent} proposals sent</span> : null}
        </div>
        {designerProfile ? (
          <>
            <p>{designerProfile.bio}</p>
            <dl className="profile-facts">
              <div>
                <dt>Education</dt>
                <dd>{designerProfile.education}</dd>
              </div>
              <div>
                <dt>Service area</dt>
                <dd>{designerProfile.location}</dd>
              </div>
            </dl>
          </>
        ) : null}
        <div className="tag-row">
          {user.specialties.length > 0 ? (
            user.specialties.map((specialty) => (
              <span className="tag" key={specialty}>
                {specialty}
              </span>
            ))
          ) : (
            <span className="muted">No specialties added</span>
          )}
        </div>
      </section>

      {designerProfile ? (
        <section className="stack profile-projects-section">
          <div className="section-title">
            <h2>Projects undertaken</h2>
            <span className="count-pill">{designerProfile.portfolio.length}</span>
          </div>
          {designerProfile.portfolio.length === 0 ? (
            <div className="card empty-state">No projects added yet.</div>
          ) : (
            <div className="card-grid">
              {designerProfile.portfolio.map((item) => (
                <article className="portfolio-card" key={item.id}>
                  {item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={item.title} /> : null}
                  <div className="stack compact">
                    <strong>{item.title}</strong>
                    <span>{projectTypeLabel(item.projectType)}</span>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
