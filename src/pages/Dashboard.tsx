import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { Avatar } from '../components/Avatar';
import { TierBadge } from '../components/TierBadge';
import { authService, marketplaceService } from '../services';
import type { DesignerProfileView, Job, Message, Project, Proposal } from '../types';
import { formatDate, formatPeso } from '../utils/format';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobStatusFilter, setJobStatusFilter] = useState<Job['status'] | 'all'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [designerProfiles, setDesignerProfiles] = useState<DesignerProfileView[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Record<string, { name: string }>>({});
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editTimeline, setEditTimeline] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [savingProposal, setSavingProposal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let alive = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [jobData, ownProjects, ownProposals, ownMessages, userData, profileData] = await Promise.all([
          marketplaceService.listJobs(),
          marketplaceService.listProjectsForUser(currentUser.id),
          marketplaceService.listProposalsForDesigner(currentUser.id),
          marketplaceService.listMessagesForUser(currentUser.id),
          authService.listUsers(),
          marketplaceService.listDesignerProfiles(),
        ]);
        if (!alive) return;
        setAllJobs(jobData);
        setJobs(jobData.filter((job) => job.clientId === currentUser.id));
        setProjects(ownProjects);
        setProposals(ownProposals);
        setMessages(ownMessages);
        setMembers(Object.fromEntries(userData.map((member) => [member.id, { name: member.name }])));
        setDesignerProfiles(profileData);
      } catch (err) {
        if (alive) setError(errorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadData();
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) return null;

  const canPostJobs = user.role === 'client' || ((user.role === 'designer' || user.role === 'pee_reviewer') && user.verification === 'verified');
  const visibleJobs = jobStatusFilter === 'all' ? jobs : jobs.filter((job) => job.status === jobStatusFilter);

  const startEditingProposal = (proposal: Proposal) => {
    setEditingProposalId(proposal.id);
    setEditPrice(String(proposal.price));
    setEditTimeline(String(proposal.timelineDays));
    setEditMessage(proposal.message);
    setProposalError(null);
  };

  const cancelEditingProposal = () => {
    setEditingProposalId(null);
    setProposalError(null);
  };

  const saveProposal = async (event: FormEvent, proposalId: string) => {
    event.preventDefault();
    setSavingProposal(true);
    setProposalError(null);
    try {
      const updated = await marketplaceService.updateProposal(proposalId, user.id, {
        price: Number(editPrice),
        timelineDays: Number(editTimeline),
        message: editMessage,
      });
      setProposals((current) => current.map((proposal) => (proposal.id === updated.id ? updated : proposal)));
      setEditingProposalId(null);
    } catch (err) {
      setProposalError(errorMessage(err));
    } finally {
      setSavingProposal(false);
    }
  };

  return (
    <main className="page dashboard-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>{user.name}</h1>
          <p className="muted">Phase 2 marketplace activity persisted locally in this browser.</p>
        </div>
        <div className="action-row">
          <Link className="btn btn-secondary" to="/marketplace">
            Browse jobs and designers
          </Link>
          {canPostJobs ? (
            <Link className="btn btn-primary" to="/jobs/new">
              Post job
            </Link>
          ) : null}
        </div>
      </section>

      {loading ? <div className="card">Loading dashboard...</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {!loading && !error ? (
        <div className="grid two dashboard-columns">
          <section className="card stack dashboard-panel">
            <div className="section-title">
              <h2>Projects</h2>
              <span className="count-pill">{projects.length}</span>
            </div>
            {projects.length === 0 ? (
              <div className="empty-state">
                <p>No accepted proposal has created a project yet.</p>
                <Link className="btn btn-secondary" to="/marketplace">
                  Find one
                </Link>
              </div>
            ) : (
              projects.map((project) => (
                <Link className="list-card dashboard-list-card" to={`/projects/${project.id}`} key={project.id}>
                  <div className="split-row">
                    <strong>{project.title}</strong>
                    <span className={`status-pill ${project.status === 'completed' ? 'completed' : 'active'}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="project-progress" aria-label={`${project.progressPercent ?? 0}% complete`}>
                    <div className="project-progress-track"><span style={{ width: `${project.progressPercent ?? 0}%` }} /></div>
                    <small>{project.progressPercent ?? 0}% complete - Created {formatDate(project.createdAt)}</small>
                  </div>
                  {project.collaboratorIds?.length ? (
                    <small>Collaborators: {project.collaboratorIds.map((memberId) => members[memberId]?.name ?? 'Ohmi member').join(', ')}</small>
                  ) : null}
                </Link>
              ))
            )}
          </section>

          <section className="card stack dashboard-panel">
            <div className="section-title">
              <h2>Your posted jobs</h2>
              <span className="count-pill">{visibleJobs.length}</span>
            </div>
            <div className="dashboard-job-filters" role="tablist" aria-label="Filter posted jobs">
              {(['all', 'open', 'assigned', 'completed', 'cancelled'] as const).map((status) => (
                <button
                  className={jobStatusFilter === status ? 'active' : ''}
                  type="button"
                  key={status}
                  onClick={() => setJobStatusFilter(status)}
                  aria-pressed={jobStatusFilter === status}
                >
                  <span>{status === 'all' ? 'All jobs' : status}</span>
                  <small>{status === 'all' ? jobs.length : jobs.filter((job) => job.status === status).length}</small>
                </button>
              ))}
            </div>
            {visibleJobs.length > 0 ? (
              visibleJobs.map((job) => (
                <Link className="list-card" to={`/jobs/${job.id}`} key={job.id}>
                  <div className="split-row"><strong>{job.title}</strong><span className={`status-pill ${job.status}`}>{job.status}</span></div>
                  <span>
                    {projectTypeLabel(job.projectType, job.projectTypeOther)} - {BUILDING_TYPE_LABELS[job.buildingType]}
                  </span>
                  <small>
                    {formatPeso(job.budgetMin)} to {formatPeso(job.budgetMax)} - {job.status}
                  </small>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                {canPostJobs ? (
                  <>
                    <p>No job posts yet. The intake form helps designers price accurately.</p>
                    <Link className="btn btn-primary" to="/jobs/new">
                      Create job post
                    </Link>
                  </>
                ) : (
                  <p>You have not posted any jobs.</p>
                )}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {messages.length > 0 ? (
        <section className="card stack dashboard-conversation">
          <div className="section-title">
            <h2>Project conversation</h2>
            <Link className="btn btn-secondary" to="/messages">Open messages</Link>
          </div>
          <p className="muted">Latest updates from your client, designer, and project collaborators.</p>
          {messages.slice().reverse().slice(0, 5).map((message) => (
            <article className="message-card" key={message.id}>
              <div className="split-row"><strong>{members[message.senderId]?.name ?? 'Ohmi member'}</strong><small>{formatDate(message.createdAt)}</small></div>
              <p>{message.body}</p>
            </article>
          ))}
        </section>
      ) : null}

      {proposals.length > 0 || user.role === 'designer' || user.role === 'pee_reviewer' ? (
        <section className="card stack dashboard-proposals">
          <div className="section-title">
            <h2>Your submitted proposals</h2>
            <span className="count-pill">{proposals.length}</span>
          </div>
          {proposalError ? <div className="alert error">{proposalError}</div> : null}
          {proposals.length === 0 ? (
            <div className="empty-state">
              <p>You have not submitted any proposals yet.</p>
              <Link className="btn btn-secondary" to="/marketplace">Browse open jobs</Link>
            </div>
          ) : (
            proposals.map((proposal) => {
              const proposalJob = allJobs.find((job) => job.id === proposal.jobId);
              const proposalProfile = designerProfiles.find((profile) => profile.userId === proposal.designerId);
              return editingProposalId === proposal.id ? (
                <form className="proposal-card stack" key={proposal.id} onSubmit={(event) => void saveProposal(event, proposal.id)}>
                  <strong>{proposalJob?.title ?? 'Job proposal'}</strong>
                  <div className="grid two">
                    <label className="field">
                      Price
                      <input type="number" min="1" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} required />
                    </label>
                    <label className="field">
                      Timeline days
                      <input type="number" min="1" value={editTimeline} onChange={(event) => setEditTimeline(event.target.value)} required />
                    </label>
                  </div>
                  <label className="field">
                    Proposal note
                    <textarea value={editMessage} onChange={(event) => setEditMessage(event.target.value)} rows={4} required />
                  </label>
                  <div className="action-row">
                    <button className="btn btn-primary" type="submit" disabled={savingProposal}>
                      {savingProposal ? 'Saving...' : 'Save changes'}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={cancelEditingProposal}>Cancel</button>
                  </div>
                </form>
              ) : (
                <article className="proposal-card" key={proposal.id}>
                  <Link className="proposal-designer proposal-designer-link" to={`/designers/${proposal.designerId}`}>
                    <Avatar name={proposalProfile?.user.name ?? 'Designer'} src={proposalProfile?.user.avatarUrl} size="md" />
                    <div>
                      <strong>{proposalProfile?.user.name ?? 'Designer profile'}</strong>
                      <div className="proposal-designer-meta">
                        {proposalProfile?.user.tier ? <TierBadge tier={proposalProfile.user.tier} status={proposalProfile.user.verification} /> : null}
                        <small>{proposalProfile?.user.verification ?? 'verification pending'}</small>
                      </div>
                    </div>
                  </Link>
                  <Link className="btn btn-secondary proposal-profile-button" to={`/designers/${proposal.designerId}`}>
                    View Profile
                  </Link>
                  <div className="split-row">
                    <div className="stack compact">
                      <Link to={`/jobs/${proposal.jobId}`}><strong>{proposalJob?.title ?? 'Job proposal'}</strong></Link>
                      <span>{formatPeso(proposal.price)} - {proposal.timelineDays} days</span>
                    </div>
                    <span className={`status-pill ${proposal.status}`}>{proposal.status}</span>
                  </div>
                  <p>{proposal.message}</p>
                  {proposal.status === 'pending' ? (
                    <button className="btn btn-secondary" type="button" onClick={() => startEditingProposal(proposal)}>
                      Edit proposal
                    </button>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      ) : null}
    </main>
  );
}
