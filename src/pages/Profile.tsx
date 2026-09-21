import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { TierBadge } from '../components/TierBadge';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { ROLE_LABELS } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';
import { marketplaceService } from '../services';
import type { DesignerProfileView, Job, Project, Review } from '../types';
import { formatDate, formatPeso } from '../utils/format';

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DesignerProfileView | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    const isDesigner = user.role === 'designer' || user.role === 'pee_reviewer';
    void Promise.all([
      isDesigner ? marketplaceService.getDesignerProfile(user.id) : Promise.resolve(null),
      isDesigner ? marketplaceService.listReviewsForDesigner(user.id) : Promise.resolve([]),
      marketplaceService.listJobs(),
      marketplaceService.listProjectsForUser(user.id),
    ]).then(([designerProfile, profileReviews, jobs, ownProjects]) => {
      setProfile(designerProfile);
      setReviews(profileReviews);
      setPostedJobs(jobs.filter((job) => job.clientId === user.id));
      setProjects(ownProjects);
    });
  }, [user]);

  if (!user) return null;
  return (
    <main className="page">
      <section className="page-heading">
        <div className="profile-heading">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
          <div>
            <p className="eyebrow">{profile?.location ?? ROLE_LABELS[user.role]}</p>
            <h1>{user.name}</h1>
            <p className="muted">{profile?.headline ?? user.email}</p>
          </div>
        </div>
        <div className="profile-heading-badges">
          {user.tier ? <TierBadge tier={user.tier} status={user.verification} /> : null}
          <span className={`status-pill ${user.verification}`}>{user.verification}</span>
          <Link className="btn btn-secondary" to="/profile/edit">Edit profile</Link>
        </div>
      </section>

      <div className="grid two uneven">
        <section className="card stack">
          <h2>{profile ? 'Professional profile' : 'Member profile'}</h2>
          <p>{profile?.bio ?? 'Client account for organizing electrical work, comparing proposals, and managing project delivery on Ohmi.'}</p>
          <div className="meta-row">
            <span>{user.location ?? 'Location not provided'}</span>
            <span>{profile ? `${profile.projectsUndertaken} projects undertaken` : `${postedJobs.length} jobs posted`}</span>
            <span>{projects.length} active projects</span>
            {profile ? <span>{profile.proposalsSent} proposals sent</span> : null}
          </div>
          <dl className="profile-facts">
            <div><dt>Address</dt><dd>{profile?.address ?? user.location ?? 'Address not provided'}</dd></div>
            <div><dt>Education</dt><dd>{profile?.education ?? ([user.educationLevel, user.educationInstitution].filter(Boolean).join(' - ') || 'Education details not provided')}</dd></div>
            {profile ? <div><dt>Service area</dt><dd>{profile.location}</dd></div> : null}
          </dl>
          <div className="tag-row">
            {user.specialties.length > 0 ? user.specialties.map((item) => <span className="tag" key={item}>{item}</span>) : <span className="muted">No specialties added</span>}
          </div>
        </section>

        <section className="card stack">
          <div className="section-title">
            <h2>{profile ? 'Ratings' : 'Account activity'}</h2>
            <strong>{profile && profile.reviewCount > 0 ? `${profile.averageRating.toFixed(1)} / 5.0` : `${projects.length} active`}</strong>
          </div>
          {profile ? (
            reviews.length === 0 ? <div className="empty-state">No reviews yet.</div> : reviews.map((review) => (
              <div className="list-card" key={review.id}><strong>{review.stars} {review.stars === 1 ? 'star' : 'stars'}</strong><span>{review.comment}</span><small>{formatDate(review.createdAt)}</small></div>
            ))
          ) : (
            <><p className="muted">Your posted jobs and accepted projects stay organized here.</p><Link className="btn btn-secondary" to="/dashboard">Open dashboard</Link></>
          )}
        </section>
      </div>

      <section className="stack">
        <div className="section-title"><h2>{profile ? 'Projects undertaken' : 'Posted projects'}</h2><span className="count-pill">{profile ? profile.portfolio.length : postedJobs.length}</span></div>
        {profile ? (
          profile.portfolio.length === 0 ? <div className="card empty-state">No projects added yet.</div> : <div className="card-grid">{profile.portfolio.map((item) => <article className="portfolio-card" key={item.id}>{item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={item.title} /> : null}<div className="stack compact"><strong>{item.title}</strong><span>{projectTypeLabel(item.projectType)}</span><p>{item.description}</p></div></article>)}</div>
        ) : (
          postedJobs.length === 0 ? <div className="card empty-state">No projects posted yet.</div> : postedJobs.map((job) => <Link className="card list-card" to={`/jobs/${job.id}`} key={job.id}><div className="split-row"><strong>{job.title}</strong><span className={`status-pill ${job.status}`}>{job.status}</span></div><span>{projectTypeLabel(job.projectType, job.projectTypeOther)} - {BUILDING_TYPE_LABELS[job.buildingType]}</span><small>{formatPeso(job.budgetMin)} to {formatPeso(job.budgetMax)} - Posted {formatDate(job.createdAt)}</small></Link>)
        )}
      </section>
    </main>
  );
}
