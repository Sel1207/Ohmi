import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { TierBadge } from '../components/TierBadge';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { ROLE_LABELS } from '../constants/roles';
import { authService, marketplaceService } from '../services';
import type { Job, User } from '../types';
import { errorMessage } from '../utils/errors';
import { formatDate, formatPeso } from '../utils/format';

export function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void Promise.all([authService.listUsers(), marketplaceService.listJobs()])
      .then(([users, allJobs]) => {
        const found = users.find((user) => user.id === id);
        if (!found) throw new Error('Profile not found.');
        setMember(found);
        setJobs(allJobs.filter((job) => job.clientId === id));
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error || !member) {
    return <main className="page"><div className="alert error">{error ?? 'Loading profile...'}</div></main>;
  }

  return (
    <main className="page narrow-page">
      <section className="page-heading profile-heading">
        <Avatar name={member.name} src={member.avatarUrl} size="lg" />
        <div>
          <p className="eyebrow">{ROLE_LABELS[member.role]}</p>
          <h1>{member.name}</h1>
          <p className="muted">{member.location ?? 'Location not provided'}</p>
        </div>
        {member.tier ? <TierBadge tier={member.tier} status={member.verification} /> : null}
      </section>

      <button className="btn btn-secondary profile-back-button" type="button" onClick={() => navigate(-1)}>
        Back
      </button>

      <section className="card stack">
        <div className="section-title">
          <h2>Member profile</h2>
          <span className={`status-pill ${member.verification}`}>{member.verification}</span>
        </div>
        <div className="meta-row"><span>{jobs.length} jobs posted</span><span>{member.email}</span></div>
        {member.specialties.length > 0 ? <div className="tag-row">{member.specialties.map((item) => <span className="tag" key={item}>{item}</span>)}</div> : null}
      </section>

      <section className="stack profile-projects-section">
        <div className="section-title"><h2>Posted projects</h2><span className="count-pill">{jobs.length}</span></div>
        {jobs.length === 0 ? <div className="card empty-state">No public projects posted yet.</div> : jobs.map((job) => (
          <Link className="card list-card" to={`/jobs/${job.id}`} key={job.id}>
            <div className="split-row"><strong>{job.title}</strong><span className={`status-pill ${job.status}`}>{job.status}</span></div>
            <span>{projectTypeLabel(job.projectType, job.projectTypeOther)} - {BUILDING_TYPE_LABELS[job.buildingType]}</span>
            <small>{formatPeso(job.budgetMin)} to {formatPeso(job.budgetMax)} - Posted {formatDate(job.createdAt)}</small>
          </Link>
        ))}
      </section>
    </main>
  );
}
