import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { marketplaceService } from '../services';
import type { Job, Project } from '../types';
import { formatDate, formatPeso } from '../utils/format';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
        const [allJobs, ownProjects] = await Promise.all([
          marketplaceService.listJobs(),
          marketplaceService.listProjectsForUser(currentUser.id),
        ]);
        if (!alive) return;
        setJobs(allJobs.filter((job) => job.clientId === currentUser.id));
        setProjects(ownProjects);
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

  return (
    <main className="page">
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
          {user.role === 'client' ? (
            <Link className="btn btn-primary" to="/jobs/new">
              Post job
            </Link>
          ) : null}
        </div>
      </section>

      {loading ? <div className="card">Loading dashboard...</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {!loading && !error ? (
        <div className="grid two">
          <section className="card stack">
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
                <Link className="list-card" to={`/projects/${project.id}`} key={project.id}>
                  <strong>{project.title}</strong>
                  <span>{project.status === 'completed' ? 'Completed' : 'Active'} project</span>
                  <small>Created {formatDate(project.createdAt)}</small>
                </Link>
              ))
            )}
          </section>

          <section className="card stack">
            <div className="section-title">
              <h2>{user.role === 'client' ? 'Your posted jobs' : 'Next actions'}</h2>
              {user.role === 'client' ? <span className="count-pill">{jobs.length}</span> : null}
            </div>
            {user.role === 'client' ? (
              jobs.length === 0 ? (
                <div className="empty-state">
                  <p>No job posts yet. The intake form helps designers price accurately.</p>
                  <Link className="btn btn-primary" to="/jobs/new">
                    Create job post
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <Link className="list-card" to={`/jobs/${job.id}`} key={job.id}>
                    <strong>{job.title}</strong>
                    <span>
                      {projectTypeLabel(job.projectType, job.projectTypeOther)} - {BUILDING_TYPE_LABELS[job.buildingType]}
                    </span>
                    <small>
                      {formatPeso(job.budgetMin)} to {formatPeso(job.budgetMax)} - {job.status}
                    </small>
                  </Link>
                ))
              )
            ) : (
              <div className="empty-state">
                <p>Browse open jobs and submit proposals that fit your verified tier.</p>
                <Link className="btn btn-primary" to="/marketplace">
                  Review job feed
                </Link>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
