import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectTypeLabel } from '../constants/marketplace';
import { TierBadge } from '../components/TierBadge';
import { Avatar } from '../components/Avatar';
import { marketplaceService } from '../services';
import type { DesignerProfileView, Review } from '../types';
import { formatDate } from '../utils/format';
import { errorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';

export function DesignerProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<DesignerProfileView | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    const designerId = id;
    let alive = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [profileData, reviewData, count] = await Promise.all([
          marketplaceService.getDesignerProfile(designerId),
          marketplaceService.listReviewsForDesigner(designerId),
          marketplaceService.followerCount(designerId),
        ]);
        if (!alive) return;
        setProfile(profileData);
        setReviews(reviewData);
        setFollowerCount(count);
        setFollowing(user ? await marketplaceService.isFollowingDesigner(designerId, user.id) : false);
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
  }, [id, user]);

  const toggleFollow = async () => {
    if (!id || !user) return;
    if (following) {
      await marketplaceService.unfollowDesigner(id, user.id);
      setFollowerCount((count) => Math.max(0, count - 1));
      setFollowing(false);
    } else {
      await marketplaceService.followDesigner(id, user.id);
      setFollowerCount((count) => count + 1);
      setFollowing(true);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="card">Loading designer profile...</div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="page">
        <div className="alert error">{error ?? 'Designer profile not found.'}</div>
      </main>
    );
  }

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.stars === stars).length,
  }));
  const highestRatingCount = Math.max(1, ...ratingCounts.map((item) => item.count));

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <Avatar name={profile.user.name} src={profile.user.avatarUrl} size="lg" />
          <p className="eyebrow">{profile.location}</p>
          <h1>{profile.user.name}</h1>
          <p className="muted">{profile.headline}</p>
        </div>
        <div className="profile-heading-badges">
          {profile.user.tier ? <TierBadge tier={profile.user.tier} status={profile.user.verification} /> : null}
          <span className={`status-pill ${profile.user.verification}`}>{profile.user.verification}</span>
          {user?.id !== profile.user.id ? (
            <>
              <Link className="btn btn-secondary" to={`/messages/new?to=${profile.user.id}`}>
                Message
              </Link>
              <button className={following ? 'follow-button active' : 'follow-button'} type="button" onClick={() => void toggleFollow()}>
                <span aria-hidden="true">{following ? '♥' : '♡'}</span> {following ? 'Following' : 'Follow'}
              </button>
            </>
          ) : null}
        </div>
      </section>

      <div className="grid two uneven">
        <section className="card stack">
          <h2>Professional profile</h2>
          <p>{profile.bio}</p>
          <div className="meta-row">
            {profile.user.prcNumber ? <span>PRC no. {profile.user.prcNumber}</span> : null}
            <span>{followerCount} followers</span>
            <span>{profile.proposalsSent} proposals sent</span>
            <span>{profile.projectsUndertaken ?? 0} projects undertaken</span>
          </div>
          <dl className="profile-facts">
            <div>
              <dt>Education</dt>
              <dd>{profile.education ?? 'Education details not provided'}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{profile.address ?? profile.location}</dd>
            </div>
            <div>
              <dt>Service area</dt>
              <dd>{profile.location}</dd>
            </div>
          </dl>
          <div className="tag-row">
            {profile.specialties.map((specialty) => (
              <span className="tag" key={specialty}>
                {specialty}
              </span>
            ))}
          </div>
          <Link className="btn btn-secondary" to="/marketplace">
            Back to marketplace
          </Link>
        </section>

        <section className="card stack">
          <div className="section-title">
            <h2>Ratings</h2>
            <span className="count-pill">{profile.reviewCount} reviews</span>
          </div>
          <div className="rating-overview">
            <div className="rating-score">
              <strong>{profile.reviewCount > 0 ? `${profile.averageRating.toFixed(1)} / 5.0` : '— / 5.0'}</strong>
              <span className="rating-stars" aria-label={`${profile.averageRating.toFixed(1)} out of 5.0 stars`}>★★★★★</span>
              <small>{profile.reviewCount > 0 ? 'Average rating' : 'No ratings yet'}</small>
            </div>
            <div className="rating-breakdown">
              {ratingCounts.map((item) => (
                <div className="rating-row" key={item.stars}>
                  <span>{item.stars}</span>
                  <div className="rating-bar"><span style={{ width: `${(item.count / highestRatingCount) * 100}%` }} /></div>
                  <small>{item.count}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="empty-state">Complete a project with this designer to leave the first review.</div>
            ) : reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="split-row"><strong className="rating-stars small">{'★'.repeat(review.stars)}</strong><small>{formatDate(review.createdAt)}</small></div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="stack">
        <div className="section-title">
          <h2>Projects undertaken</h2>
          <span className="count-pill">{profile.projectsUndertaken ?? profile.portfolio.length}</span>
        </div>
        {profile.portfolio.length === 0 ? (
          <div className="card empty-state">No portfolio items yet.</div>
        ) : (
          <div className="card-grid">
            {profile.portfolio.map((item) => (
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
    </main>
  );
}
