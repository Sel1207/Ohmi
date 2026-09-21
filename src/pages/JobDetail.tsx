import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BUILDING_TYPE_LABELS, INTAKE_HELP, POWER_TYPE_LABELS, PROJECT_STATUS_LABELS, projectTypeLabel } from '../constants/marketplace';
import { TierBadge } from '../components/TierBadge';
import { marketplaceService } from '../services';
import type { DesignerProfileView, Job, JobIntake, Proposal } from '../types';
import { formatDate, formatPeso } from '../utils/format';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

function measurementText(item: JobIntake[keyof JobIntake]): string {
  if (item.unknown) return 'I do not know yet';
  return typeof item.value === 'number' ? String(item.value) : 'Not provided';
}

export function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [profiles, setProfiles] = useState<DesignerProfileView[]>([]);
  const [price, setPrice] = useState('');
  const [timelineDays, setTimelineDays] = useState('10');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const jobData = await marketplaceService.getJob(id);
      const [proposalData, profileData] = await Promise.all([
        user?.id === jobData.clientId ? marketplaceService.listProposalsForJob(id, user.id) : Promise.resolve([]),
        marketplaceService.listDesignerProfiles(),
      ]);
      setJob(jobData);
      setProposals(proposalData);
      setProfiles(profileData);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.userId, profile])), [profiles]);

  const canPropose = user?.role === 'designer' || user?.role === 'pee_reviewer';
  const isOwner = Boolean(user && job && user.id === job.clientId);

  const handleProposal = async (event: FormEvent) => {
    event.preventDefault();
    if (!job || !user) return;
    setSaving(true);
    setFormError(null);
    try {
      await marketplaceService.submitProposal(job.id, user.id, {
        price: Number(price),
        timelineDays: Number(timelineDays),
        message,
      });
      setPrice('');
      setMessage('');
      await loadData();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const acceptProposal = async (proposalId: string) => {
    if (!user) return;
    setFormError(null);
    try {
      const project = await marketplaceService.acceptProposal(proposalId, user.id);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="card">Loading job...</div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="page">
        <div className="alert error">{error ?? 'Job not found.'}</div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{projectTypeLabel(job.projectType, job.projectTypeOther)}</p>
          <h1>{job.title}</h1>
          <p className="muted">
            {BUILDING_TYPE_LABELS[job.buildingType]} in {job.location} - Posted {formatDate(job.createdAt)}
          </p>
        </div>
        <span className={`status-pill ${job.status}`}>{job.status}</span>
      </section>

      {formError ? <div className="alert error">{formError}</div> : null}

      <div className="grid two uneven">
        <section className="card stack">
          <div className="section-title">
            <h2>Client scope</h2>
            <strong>
              {formatPeso(job.budgetMin)} to {formatPeso(job.budgetMax)}
            </strong>
          </div>
          <p>{job.scope}</p>
          <div className="intake-summary">
            <div className="metric"><span>Project status</span><strong>{job.projectStatus ? PROJECT_STATUS_LABELS[job.projectStatus] : 'Not provided'}</strong></div>
            <div className="metric"><span>Power type</span><strong>{job.powerType ? POWER_TYPE_LABELS[job.powerType] : 'Not provided'}</strong></div>
            <div className="metric"><span>Target timeline</span><strong>{job.targetTimeline ?? 'Not provided'}</strong></div>
          </div>
          <div className="intake-summary">
            {Object.entries(INTAKE_HELP).map(([key, help]) => (
              <div className="metric" key={key}>
                <span>{help.label}</span>
                <strong>{measurementText(job.intake[key as keyof JobIntake])}</strong>
              </div>
            ))}
          </div>
          {job.supportingFiles?.length ? <div className="metric"><span>Supporting files</span><strong>{job.supportingFiles.join(', ')}</strong></div> : null}
        </section>

        <section className="card stack">
          <div className="section-title">
            <h2>Submit proposal</h2>
          </div>
          {!user ? (
            <div className="empty-state guest-proposal-state">
              <p>Sign in with a designer or PEE reviewer account to submit a proposal for this job.</p>
              <Link className="btn btn-primary" to="/login">
                Sign in
              </Link>
            </div>
          ) : !canPropose ? (
            <p className="muted">Proposal submissions are available to designer and PEE reviewer accounts. Client accounts can post jobs and review incoming proposals.</p>
          ) : job.status !== 'open' ? (
            <p className="muted">This job is already assigned.</p>
          ) : (
            <form className="stack" onSubmit={handleProposal}>
              <div className="grid two">
                <label className="field">
                  Price
                  <input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} />
                </label>
                <label className="field">
                  Timeline days
                  <input
                    type="number"
                    min="1"
                    value={timelineDays}
                    onChange={(event) => setTimelineDays(event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                Proposal note
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} />
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Submitting...' : 'Submit proposal'}
              </button>
            </form>
          )}
        </section>
      </div>

      {isOwner ? (
      <section className="card stack">
        <div className="section-title">
          <h2>Proposals</h2>
          <span className="count-pill">{proposals.length}</span>
        </div>
        {proposals.length === 0 ? (
          <div className="empty-state">No proposals yet.</div>
        ) : (
          proposals.map((proposal) => {
            const profile = profileById.get(proposal.designerId);
            return (
              <div className="proposal-card" key={proposal.id}>
                <div className="split-row">
                  <div className="stack compact">
                    <strong>{profile?.user.name ?? 'Designer'}</strong>
                    {profile?.user.tier ? (
                      <TierBadge tier={profile.user.tier} status={profile.user.verification} />
                    ) : null}
                    <small>
                      {profile?.reviewCount
                        ? `${profile.averageRating.toFixed(1)} stars from ${profile.reviewCount} reviews`
                        : 'No reviews yet'}
                    </small>
                  </div>
                  <div className="proposal-price">
                    <strong>{formatPeso(proposal.price)}</strong>
                    <small>{proposal.timelineDays} days</small>
                  </div>
                </div>
                <p>{proposal.message}</p>
                <div className="split-row">
                  <span className={`status-pill ${proposal.status}`}>{proposal.status}</span>
                  {isOwner && job.status === 'open' && proposal.status === 'pending' ? (
                    <button className="btn btn-primary" type="button" onClick={() => void acceptProposal(proposal.id)}>
                      Accept and create project
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </section>
      ) : null}
    </main>
  );
}
