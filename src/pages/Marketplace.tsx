import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BUILDING_TYPE_LABELS, projectTypeLabel } from '../constants/marketplace';
import { TIER_ORDER } from '../constants/tiers';
import { TierBadge } from '../components/TierBadge';
import { Avatar } from '../components/Avatar';
import { VerificationBadge } from '../components/VerificationBadge';
import { authService, marketplaceService, trustSafetyService } from '../services';
import type { BuildingType, DesignerProfileView, Job, MarketplaceFilters, TierId } from '../types';
import { formatDate, formatPeso } from '../utils/format';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

const JOBS_PER_PAGE = 6;
const DESIGNERS_PER_PAGE = 8;

export function Marketplace() {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [tier, setTier] = useState<TierId | 'all'>('all');
  const [buildingType, setBuildingType] = useState<BuildingType | 'all'>('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaceView, setMarketplaceView] = useState<'combined' | 'jobs' | 'designers'>('combined');
  const [currentPage, setCurrentPage] = useState(1);
  const [designerPage, setDesignerPage] = useState(1);
  const [designers, setDesigners] = useState<DesignerProfileView[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [members, setMembers] = useState<Record<string, { name: string; avatarUrl?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo<MarketplaceFilters>(
    () => ({
      location,
      tier,
      buildingType,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
    }),
    [location, tier, buildingType, minBudget, maxBudget],
  );
  const canPostJobs = Boolean(user && (user.role === 'client' || ((user.role === 'designer' || user.role === 'pee_reviewer') && user.verification === 'verified')));

  useEffect(() => {
    let alive = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [profileData, jobData, userData] = await Promise.all([
          marketplaceService.listDesignerProfiles(filters),
          marketplaceService.listJobs(filters),
          authService.listUsers(),
        ]);
        if (!alive) return;
        const visibleDesigners = user ? profileData.filter((profile) => !trustSafetyService.isBlocked(user.id, profile.user.id)) : profileData;
        const visibleJobs = user ? jobData.filter((job) => job.clientId !== user.id && !trustSafetyService.isBlocked(user.id, job.clientId)) : jobData;
        setDesigners(visibleDesigners);
        setJobs(visibleJobs);
        setMembers(Object.fromEntries(userData.map((member) => [member.id, member])));
        setCurrentPage(1);
        setDesignerPage(1);
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
  }, [filters, user]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchTerm(searchInput.trim().toLowerCase());
    setCurrentPage(1);
  };

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.scope,
        job.location,
        projectTypeLabel(job.projectType, job.projectTypeOther),
        BUILDING_TYPE_LABELS[job.buildingType],
      ].join(' ').toLowerCase();
      return searchableText.includes(searchTerm);
    });
  }, [jobs, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const visibleJobs = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);
  const designerTotalPages = Math.max(1, Math.ceil(designers.length / DESIGNERS_PER_PAGE));
  const visibleDesigners = designers.slice((designerPage - 1) * DESIGNERS_PER_PAGE, designerPage * DESIGNERS_PER_PAGE);

  return (
    <main className="page marketplace-shell">
      <section className="marketplace-hero">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1>Hire trusted EE talent or find the right project.</h1>
          <p className="muted">
            Browse qualified designers, compare scopes, and move from enquiry to project faster with a clearer
            workflow.
          </p>
        </div>
        <div className="marketplace-cta">
          {!user ? (
            <Link className="btn btn-primary" to="/login">
              Sign in to hire
            </Link>
          ) : canPostJobs ? (
            <Link className="btn btn-primary" to="/jobs/new">
              Post a project
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/marketplace">
              Browse open jobs
            </Link>
          )}
          <Link className="btn btn-secondary" to="/about">
            How it works
          </Link>
        </div>
      </section>

      <section className="card filter-bar" aria-label="Marketplace filters">
        <form className="job-search" onSubmit={handleSearch}>
          <label className="field">
            Search jobs
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Lighting layout, CAD, power plan..." />
          </label>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
        <label className="field">
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or province" />
        </label>
        <label className="field">
          Tier
          <select value={tier} onChange={(event) => setTier(event.target.value as TierId | 'all')}>
            <option value="all">All tiers</option>
            {TIER_ORDER.map((tierId) => (
              <option key={tierId} value={tierId}>
                {tierId === 'student' ? 'Student Practitioner' : tierId.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Building type
          <select value={buildingType} onChange={(event) => setBuildingType(event.target.value as BuildingType | 'all')}>
            <option value="all">All building types</option>
            {Object.entries(BUILDING_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Min budget
          <input type="number" min="0" value={minBudget} onChange={(event) => setMinBudget(event.target.value)} />
        </label>
        <label className="field">
          Max budget
          <input type="number" min="0" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} />
        </label>
      </section>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="card">Loading marketplace...</div> : null}

      {!loading && !error ? (
        <div className={`marketplace-grid ${marketplaceView === 'combined' ? '' : 'single-view'}`}>
          {marketplaceView !== 'jobs' ? (
          <section className="stack">
            <div className="section-title">
              <div className="marketplace-section-heading">
                <h2>Designer profiles</h2>
                <button className="marketplace-focus-button" type="button" onClick={() => setMarketplaceView(marketplaceView === 'designers' ? 'combined' : 'designers')} aria-label="Show designer profiles only" title="Show designer profiles only">
                  +
                </button>
              </div>
              <span className="count-pill">{designers.length}</span>
            </div>
            {designers.length === 0 ? (
              <div className="card empty-state">No designers match these filters.</div>
            ) : (
              <div className="card-grid">
                {visibleDesigners.map((profile) => {
                  const image = profile.portfolio[0]?.imageUrls[0];
                  return (
                    <Link className="profile-card" to={`/designers/${profile.userId}`} key={profile.userId}>
                      <div className="profile-card-visual">
                        <Avatar name={profile.user.name} src={profile.user.avatarUrl} size="lg" />
                        {image ? <img className="profile-work-preview" src={image} alt="" /> : null}
                      </div>
                      <div className="stack compact">
                        <div className="profile-card-identity">
                          <strong>{profile.user.name}</strong>
                          <VerificationBadge status={profile.user.verification} />
                          {profile.user.tier ? (
                            <TierBadge tier={profile.user.tier} status={profile.user.verification} />
                          ) : null}
                        </div>
                        <span className="profile-headline">{profile.headline}</span>
                        <small>{profile.location}</small>
                        <small>
                          {profile.reviewCount > 0
                            ? `${profile.averageRating.toFixed(1)} stars from ${profile.reviewCount} reviews`
                            : 'No reviews yet'}
                        </small>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            {designerTotalPages > 1 ? (
              <nav className="pagination" aria-label="Designer profile pages">
                {Array.from({ length: designerTotalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    className={pageNumber === designerPage ? 'active' : ''}
                    type="button"
                    key={pageNumber}
                    onClick={() => setDesignerPage(pageNumber)}
                    aria-current={pageNumber === designerPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
              </nav>
            ) : null}
          </section>
          ) : null}

          {marketplaceView !== 'designers' ? (
          <section className="stack">
            <div className="section-title">
              <div className="marketplace-section-heading">
                <h2>Job feed</h2>
                <button className="marketplace-focus-button" type="button" onClick={() => setMarketplaceView(marketplaceView === 'jobs' ? 'combined' : 'jobs')} aria-label="Show job feed only" title="Show job feed only">
                  +
                </button>
              </div>
              <span className="count-pill">{filteredJobs.length}</span>
            </div>
            {filteredJobs.length === 0 ? (
              <div className="card empty-state">No open jobs match your search and filters.</div>
            ) : (
              visibleJobs.map((job) => (
                <article className="card job-card" key={job.id}>
                  <Link className="job-card-link" to={`/jobs/${job.id}`}>
                  <div className="split-row">
                    <div className="job-copy">
                      <strong>{job.title}</strong>
                      <p>{job.scope}</p>
                    </div>
                    <span className={`status-pill ${job.status}`}>{job.status}</span>
                  </div>
                  <div className="meta-row">
                    <span>{projectTypeLabel(job.projectType, job.projectTypeOther)}</span>
                    <span>{BUILDING_TYPE_LABELS[job.buildingType]}</span>
                    <span>
                      {formatPeso(job.budgetMin)} to {formatPeso(job.budgetMax)}
                    </span>
                    <span>{formatDate(job.createdAt)}</span>
                  </div>
                  <div className="job-location">Location: {job.location}</div>
                  </Link>
                  <Link className="job-poster" to={`/profiles/${job.clientId}`}>
                    <Avatar name={members[job.clientId]?.name ?? 'Ohmi member'} src={members[job.clientId]?.avatarUrl} size="sm" />
                    <span>Posted by {members[job.clientId]?.name ?? 'Ohmi member'} - View profile</span>
                  </Link>
                </article>
              ))
            )}
            {totalPages > 1 ? (
              <nav className="pagination" aria-label="Job feed pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    className={pageNumber === currentPage ? 'active' : ''}
                    type="button"
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
              </nav>
            ) : null}
          </section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
