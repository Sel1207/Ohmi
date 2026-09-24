import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { TierBadge } from '../components/TierBadge';
import { VerificationBadge } from '../components/VerificationBadge';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { ROLE_LABELS } from '../constants/roles';
import { authService, marketplaceService, trustSafetyService } from '../services';
import type { Job, User } from '../types';
import { errorMessage } from '../utils/errors';
import { formatDate, formatPeso } from '../utils/format';
import { useAuth } from '../hooks/useAuth';

export function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [trustMessage, setTrustMessage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    void Promise.all([authService.listUsers(), marketplaceService.listJobs()])
      .then(([users, allJobs]) => {
        const found = users.find((user) => user.id === id);
        if (!found) throw new Error('Profile not found.');
        setMember(found);
        setJobs(allJobs.filter((job) => job.clientId === id));
        setBlocked(user ? trustSafetyService.isBlocked(user.id, found.id) : false);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id, user]);

  const toggleBlock = () => {
    if (!user || !member) return;
    const nextBlocked = trustSafetyService.toggleBlock(user.id, member.id);
    setBlocked(nextBlocked);
    setTrustMessage(nextBlocked ? 'This member has been blocked.' : 'This member has been unblocked.');
  };

  const reportMember = () => {
    if (!user || !member) return;
    const reason = window.prompt('Why are you reporting this member?');
    if (!reason?.trim()) return;
    trustSafetyService.reportUser(user.id, member.id, reason.trim());
    setTrustMessage('Thanks. Your report has been recorded for review.');
  };

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
        <VerificationBadge status={member.verification} />
      </section>

      <button className="btn btn-secondary profile-back-button" type="button" onClick={() => navigate(-1)}>
        Back
      </button>

      <section className="card stack">
        <div className="section-title">
          <h2>Member profile</h2>
          <VerificationBadge status={member.verification} />
        </div>
        <div className="meta-row"><span>{jobs.length} jobs posted</span><span>{member.email}</span></div>
        {user && user.id !== member.id ? (
          <div className="trust-actions">
            <button className="btn btn-secondary" type="button" onClick={toggleBlock}>{blocked ? 'Unblock member' : 'Block member'}</button>
            <button className="btn btn-secondary" type="button" onClick={reportMember}>Report member</button>
          </div>
        ) : null}
        {trustMessage ? <p className="muted">{trustMessage}</p> : null}
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
