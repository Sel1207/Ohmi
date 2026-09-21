import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { Avatar } from '../components/Avatar';
import { TierBadge } from '../components/TierBadge';
import { authService, marketplaceService } from '../services';
import type { DesignerProfileView, Job, Message, ProgressUpdate, Project, ProjectFile, Proposal, Review, User } from '../types';
import { formatDate, formatPeso } from '../utils/format';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

export function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [designer, setDesigner] = useState<DesignerProfileView | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [progressDraft, setProgressDraft] = useState(0);
  const [progressReport, setProgressReport] = useState('');
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [progressPopup, setProgressPopup] = useState<ProgressUpdate | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [members, setMembers] = useState<Record<string, User>>({});
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [stars, setStars] = useState('5');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const projectData = await marketplaceService.getProject(id);
      const [jobData, proposalData, designerData, reviews, fileData, userData, messageData, progressData] = await Promise.all([
        marketplaceService.getJob(projectData.jobId),
        marketplaceService.listProposalsForJob(projectData.jobId, projectData.clientId),
        marketplaceService.getDesignerProfile(projectData.designerId),
        marketplaceService.listReviewsForDesigner(projectData.designerId),
        marketplaceService.listProjectFiles(projectData.id),
        authService.listUsers(),
        user ? marketplaceService.listMessagesForProject(projectData.id, user.id) : Promise.resolve([]),
        user ? marketplaceService.listProgressUpdates(projectData.id, user.id) : Promise.resolve([]),
      ]);
      setProject(projectData);
      setProgressDraft(projectData.progressPercent ?? 0);
      setJob(jobData);
      setProposal(proposalData.find((item) => item.id === projectData.proposalId) ?? null);
      setDesigner(designerData);
      setExistingReview(reviews.find((review) => review.projectId === projectData.id) ?? null);
      setProjectFiles(fileData);
      setInviteLink(marketplaceService.getProjectInviteLink(projectData.id));
      setMembers(Object.fromEntries(userData.map((member) => [member.id, member])));
      setConversation(messageData);
      setProgressUpdates(progressData);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const completeProject = async () => {
    if (!project || !user) return;
    setActionError(null);
    try {
      await marketplaceService.completeProject(project.id, user.id);
      await loadData();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!project || !user) return;
    setActionError(null);
    try {
      await marketplaceService.rateDesigner(project.id, user.id, Number(stars), comment);
      setComment('');
      await loadData();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!project || !user) return;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploadingFiles(true);
    setActionError(null);
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('The file could not be read.'));
          reader.onerror = () => reject(new Error('The file could not be read.'));
          reader.readAsDataURL(file);
        });
        await marketplaceService.uploadProjectFile(project.id, user.id, {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
        });
      }
      setProjectFiles(await marketplaceService.listProjectFiles(project.id));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setUploadingFiles(false);
      event.target.value = '';
    }
  };

  const joinProject = async () => {
    if (!project || !user) return;
    setActionError(null);
    try {
      const joined = await marketplaceService.joinProjectByInvite(project.id, searchParams.get('invite') ?? '', user.id);
      setProject(joined);
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const sendProjectMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!project || !user) return;
    setSendingMessage(true);
    setActionError(null);
    try {
      const message = await marketplaceService.sendProjectMessage(project.id, user.id, messageBody);
      setConversation((current) => [...current, message]);
      setMessageBody('');
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setSendingMessage(false);
    }
  };

  const saveProgress = async () => {
    if (!project || !user) return;
    setSavingProgress(true);
    setActionError(null);
    try {
      const updated = await marketplaceService.updateProjectProgress(project.id, user.id, progressDraft, progressReport);
      setProject(updated);
      const updates = await marketplaceService.listProgressUpdates(project.id, user.id);
      setProgressUpdates(updates);
      setProgressPopup(updates[0] ?? null);
      setProgressReport('');
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setSavingProgress(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="card">Loading project...</div>
      </main>
    );
  }

  if (error || !project || !job || !designer) {
    return (
      <main className="page">
        <div className="alert error">{error ?? 'Project not found.'}</div>
      </main>
    );
  }

  const canRate = user?.id === project.clientId && project.status === 'completed' && !existingReview;
  const isMember = Boolean(user && (user.id === project.clientId || user.id === project.designerId || project.collaboratorIds?.includes(user.id)));
  const canEditProgress = user?.id === project.designerId;

  return (
    <main className="page">
      <section className="page-heading">
        <div>

        <section className="card stack project-progress-editor">
          <div className="section-title">
            <div>
              <h2>Project progress</h2>
              <small className="muted">Keep everyone aligned on the current handoff.</small>
            </div>
            <strong>{project.progressPercent ?? 0}%</strong>
          </div>
          <div className="project-progress-track project-progress-track-large">
            <span style={{ width: `${progressDraft}%` }} />
          </div>
          {canEditProgress ? (
            <div className="project-progress-controls">
              <input type="range" min="0" max="100" step="1" value={progressDraft} onChange={(event) => setProgressDraft(Number(event.target.value))} aria-label="Project progress percentage" />
              <input value={progressReport} onChange={(event) => setProgressReport(event.target.value)} placeholder="What was done in this progress?" aria-label="Progress report" />
              <button className="btn btn-secondary" type="button" onClick={() => void saveProgress()} disabled={savingProgress || progressDraft === (project.progressPercent ?? 0) || !progressReport.trim()}>
                {savingProgress ? 'Saving...' : 'Save progress'}
              </button>
            </div>
          ) : <small className="muted">Only the assigned designer can update progress.</small>}
          {progressUpdates.length > 0 ? (
            <div className="progress-history">
              <strong>Recent progress reports</strong>
              {progressUpdates.slice(0, 3).map((update) => <div className="progress-report" key={update.id}><span>{update.progressPercent}%</span><p>{update.report}</p><small>{formatDate(update.createdAt)}</small></div>)}
            </div>
          ) : null}
        </section>

        {progressPopup ? (
          <div className="progress-popup-backdrop" role="presentation">
            <section className="progress-popup" role="dialog" aria-modal="true" aria-labelledby="progress-popup-title">
              <span className="eyebrow">Progress updated</span>
              <h2 id="progress-popup-title">{progressPopup.progressPercent}% complete</h2>
              <p>{progressPopup.report}</p>
              <button className="btn btn-primary" type="button" onClick={() => setProgressPopup(null)}>Close report</button>
            </section>
          </div>
        ) : null}
          <p className="eyebrow">Project handoff</p>
          <h1>{project.title}</h1>
          <p className="muted">
            Created {formatDate(project.createdAt)} from an accepted marketplace proposal.
          </p>
        </div>
        <span className={`status-pill ${project.status}`}>{project.status}</span>
      </section>

      {actionError ? <div className="alert error">{actionError}</div> : null}

      <div className="project-workspace-grid">
        <div className="stack">
          <section className="card stack">
          <div className="section-title">
            <h2>Accepted proposal</h2>
            {proposal ? <strong>{formatPeso(proposal.price)}</strong> : null}
          </div>
          <p>{proposal?.message ?? 'Proposal details are unavailable.'}</p>
          <div className="meta-row">
            <span>{projectTypeLabel(job.projectType, job.projectTypeOther)}</span>
            <span>{BUILDING_TYPE_LABELS[job.buildingType]}</span>
            <span>{job.location}</span>
            {proposal ? <span>{proposal.timelineDays} days</span> : null}
          </div>
          <Link className="btn btn-secondary" to={`/jobs/${job.id}`}>
            View original job
          </Link>
          </section>

          <section className="card stack">
          <div className="section-title">
            <h2>Designer</h2>
            {designer.user.tier ? <TierBadge tier={designer.user.tier} status={designer.user.verification} /> : null}
          </div>
          <strong>{designer.user.name}</strong>
          <p>{designer.headline}</p>
          <Link className="btn btn-secondary" to={`/designers/${designer.userId}`}>
            View profile
          </Link>
          </section>
        </div>

        <section className="card stack project-chat-panel">
          <div className="section-title">
            <div>
              <h2>Project conversation</h2>
              <small className="muted">Client, designer, and collaborators</small>
            </div>
            <span className="count-pill">{conversation.length}</span>
          </div>
          <div className="project-chat-members">
            {[project.clientId, project.designerId, ...(project.collaboratorIds ?? [])].filter((memberId, index, ids) => ids.indexOf(memberId) === index).map((memberId) => (
              <span className="tag" key={memberId}>{members[memberId]?.name ?? 'Ohmi member'}</span>
            ))}
          </div>
          <div className="project-chat-messages">
            {conversation.length === 0 ? <div className="empty-state">No messages yet. Start the project conversation.</div> : conversation.map((message) => (
                <article className={message.senderId === user?.id ? 'project-chat-message own' : 'project-chat-message'} key={message.id}>
                <div className="project-chat-author">
                  <Avatar name={members[message.senderId]?.name ?? 'Ohmi member'} src={members[message.senderId]?.avatarUrl} size="sm" />
                  <div><strong>{members[message.senderId]?.name ?? 'Ohmi member'}</strong><small>{formatDate(message.createdAt)}</small></div>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
          {isMember ? (
            <form className="stack" onSubmit={sendProjectMessage}>
              <label className="field">
                Message the project group
                <textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows={3} placeholder="Share an update with the team..." required />
              </label>
              <button className="btn btn-primary" type="submit" disabled={sendingMessage}>
                {sendingMessage ? 'Sending...' : 'Send message'}
              </button>
            </form>
          ) : <p className="muted">Join the project to participate in this conversation.</p>}
        </section>
      </div>

      <div className="grid two">
        <section className="card stack">
          <div className="section-title">
            <h2>Shared project files</h2>
            <span className="count-pill">{projectFiles.length}</span>
          </div>
          {isMember ? (
            <label className="field">
              Upload files
              <input type="file" multiple onChange={uploadFiles} disabled={uploadingFiles} />
              <span className="help-text">Files are stored locally in this browser, up to 2 MB each.</span>
            </label>
          ) : (
            <p className="muted">Join this project to upload and access shared files.</p>
          )}
          {projectFiles.length === 0 ? <div className="empty-state">No files uploaded yet.</div> : projectFiles.map((file) => (
            <a className="list-card" href={file.dataUrl} download={file.name} key={file.id}>
              <strong>{file.name}</strong>
              <small>{Math.max(1, Math.round(file.size / 1024))} KB - Download</small>
            </a>
          ))}
        </section>

        <section className="card stack">
          <div className="section-title"><h2>Project collaboration</h2></div>
          {!isMember && searchParams.get('invite') ? (
            <div className="alert">You have been invited to collaborate on this project.</div>
          ) : null}
          <label className="field">
            Invite link
            <input value={inviteLink} readOnly />
          </label>
          <div className="action-row">
            <button className="btn btn-secondary" type="button" onClick={() => void copyInviteLink()}>
              {inviteCopied ? 'Copied' : 'Copy invite link'}
            </button>
            {!isMember && user && searchParams.get('invite') ? (
              <button className="btn btn-primary" type="button" onClick={() => void joinProject()}>
                Join project
              </button>
            ) : null}
          </div>
          <p className="muted">Share this link with signed-in Ohmi members so they can join the collaboration workspace.</p>
        </section>
      </div>

      <section className="card stack">
        <div className="section-title">
          <h2>Completion and rating</h2>
        </div>
        {project.status !== 'completed' ? (
          <>
            <p className="muted">Mark this marketplace handoff complete when the Phase 2 scope is done.</p>
            <button className="btn btn-primary" type="button" onClick={() => void completeProject()}>
              Mark complete
            </button>
          </>
        ) : existingReview ? (
          <div className="list-card">
            <strong>{existingReview.stars} stars</strong>
            <span>{existingReview.comment}</span>
            <small>{formatDate(existingReview.createdAt)}</small>
          </div>
        ) : canRate ? (
          <form className="stack" onSubmit={submitReview}>
            <label className="field">
              Rating
              <select value={stars} onChange={(event) => setStars(event.target.value)}>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </label>
            <label className="field">
              Review comment
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
            </label>
            <button className="btn btn-primary" type="submit">
              Submit rating
            </button>
          </form>
        ) : (
          <p className="muted">The client can leave a rating after completion.</p>
        )}
      </section>
    </main>
  );
}
