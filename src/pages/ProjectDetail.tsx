import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { TierBadge } from '../components/TierBadge';
import { marketplaceService } from '../services';
import type { DesignerProfileView, Job, Project, Proposal, Review } from '../types';
import { formatDate, formatPeso } from '../utils/format';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

export function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [designer, setDesigner] = useState<DesignerProfileView | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
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
      const [jobData, proposalData, designerData, reviews] = await Promise.all([
        marketplaceService.getJob(projectData.jobId),
        marketplaceService.listProposalsForJob(projectData.jobId, projectData.clientId),
        marketplaceService.getDesignerProfile(projectData.designerId),
        marketplaceService.listReviewsForDesigner(projectData.designerId),
      ]);
      setProject(projectData);
      setJob(jobData);
      setProposal(proposalData.find((item) => item.id === projectData.proposalId) ?? null);
      setDesigner(designerData);
      setExistingReview(reviews.find((review) => review.projectId === projectData.id) ?? null);
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

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Project handoff</p>
          <h1>{project.title}</h1>
          <p className="muted">
            Created {formatDate(project.createdAt)} from an accepted marketplace proposal.
          </p>
        </div>
        <span className={`status-pill ${project.status}`}>{project.status}</span>
      </section>

      {actionError ? <div className="alert error">{actionError}</div> : null}

      <div className="grid two">
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
