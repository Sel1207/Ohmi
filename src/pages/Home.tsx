import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { TierBadge } from '../components/TierBadge';
import { TIER_ORDER, TIERS } from '../constants/tiers';
import { useAuth } from '../hooks/useAuth';
import { marketplaceService } from '../services';
import type { TierId } from '../types';
import { formatPeso } from '../utils/format';

// A static sample so first-time visitors can see what a job and its proposals look like.
const exampleFacts = [
  { label: 'Service rating', value: '45 kVA', unknown: false },
  { label: 'Floor area', value: '70 sqm', unknown: false },
  { label: 'Breakers', value: 'I do not know yet', unknown: true },
  { label: 'Storeys', value: '1', unknown: false },
];

const exampleProposals: { name: string; tier: TierId; price: number; days: number }[] = [
  { name: 'Engr. Ana Villanueva', tier: 'ree', price: 48000, days: 10 },
  { name: 'Engr. Carlo Mendoza', tier: 'pee', price: 55000, days: 7 },
];

interface LiveStats {
  profiles: number;
  verified: number;
  openJobs: number;
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/** Real counts from the marketplace service, so the page never claims more than exists. */
function useLiveStats(): LiveStats | null {
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([marketplaceService.listDesignerProfiles(), marketplaceService.listJobs()])
      .then(([profiles, jobs]) => {
        if (!alive) return;
        setStats({
          profiles: profiles.length,
          verified: profiles.filter(
            (p) => p.user.tier && p.user.tier !== 'student' && p.user.verification === 'verified',
          ).length,
          openJobs: jobs.filter((job) => job.status === 'open').length,
        });
      })
      .catch(() => {
        // The counts are a nice-to-have. If they fail, leave the line out.
      });
    return () => {
      alive = false;
    };
  }, []);

  return stats;
}

function YesNo({ yes }: { yes: boolean }) {
  return <span className={yes ? 'yn yes' : 'yn no'}>{yes ? 'Yes' : 'No'}</span>;
}

export function Home() {
  const { user } = useAuth();
  const stats = useLiveStats();

  // Clients (and visitors) come to post work. Designers and admins come to find it.
  const audience =
    !user || user.role === 'client'
      ? {
          primary: { to: '/jobs/new', label: 'Post a job' },
          secondary: { to: '/marketplace', label: 'Browse designers' },
          closing: 'Ready to scope your first job?',
          closingText: 'Tell designers what the building needs, then compare proposals in one place.',
        }
      : {
          primary: { to: '/marketplace', label: 'Browse open jobs' },
          secondary: { to: '/dashboard', label: 'Go to your dashboard' },
          closing: 'Find a job that fits your license.',
          closingText: 'Open jobs list their scope and budget, so you can bid on work your tier can take.',
        };

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <h1>Professional electrical design coordination, without the messy chats.</h1>
          <p className="lead">
            Ohmi connects clients, licensed engineers, and field teams in one place, so electrical jobs are scoped,
            priced, and delivered with less guesswork.
          </p>
          <div className="action-row">
            <Link className="btn btn-primary btn-lg" to={audience.primary.to}>
              {audience.primary.label}
            </Link>
            <Link className="btn btn-secondary btn-lg" to={audience.secondary.to}>
              {audience.secondary.label}
            </Link>
          </div>
          {stats ? (
            <p className="muted live-line">
              Right now: {plural(stats.profiles, 'designer profile')} ({stats.verified} PRC-verified) and{' '}
              {plural(stats.openJobs, 'open job')}.
            </p>
          ) : null}
        </div>

        <article className="specimen" aria-label="Example job post with proposals">
          <div className="specimen-head">
            <span>Example job post</span>
            <span className="status-pill open">open</span>
          </div>
          <div className="specimen-body">
            <div>
              <h2>Cafe fit-out electrical plans</h2>
              <p className="muted">Commercial in Quezon City. Budget {formatPeso(35000)} to {formatPeso(60000)}.</p>
            </div>
            <dl className="facts">
              {exampleFacts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd className={fact.unknown ? 'unknown' : undefined}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="specimen-subhead">Proposals</div>
          <ul className="specimen-proposals">
            {exampleProposals.map((proposal) => (
              <li key={proposal.name}>
                <div className="who">
                  <strong>{proposal.name}</strong>
                  <TierBadge tier={proposal.tier} status="verified" />
                </div>
                <div className="proposal-price">
                  <strong>{formatPeso(proposal.price)}</strong>
                  <small>{proposal.days} days</small>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Know who is allowed to do what</h2>
          <p className="muted">
            Each profile carries one of these tiers. Design and calculation jobs only accept proposals from tiers
            that can design.
          </p>
        </div>
        <div className="table-wrap">
          <table className="tier-table">
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Scope of work</th>
                <th scope="col">Design</th>
                <th scope="col">Seal plans</th>
              </tr>
            </thead>
            <tbody>
              {TIER_ORDER.map((id) => {
                const tier = TIERS[id];
                return (
                  <tr key={id} style={{ '--tier': tier.color } as CSSProperties}>
                    <th scope="row">
                      {tier.fullName}
                      <small>{tier.requiresLicense ? 'PRC license required' : 'No license required'}</small>
                    </th>
                    <td>{tier.summary}</td>
                    <td className="tier-yn">
                      <YesNo yes={tier.canDesign} />
                    </td>
                    <td className="tier-yn">
                      <YesNo yes={tier.canSeal} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cta-panel">
        <div>
          <h2>{audience.closing}</h2>
          <p className="muted">{audience.closingText}</p>
        </div>
        <div className="action-row">
          <Link className="btn btn-primary btn-lg" to={audience.primary.to}>
            {audience.primary.label}
          </Link>
          <Link className="btn btn-secondary btn-lg" to="/how-it-works">
            See how it works
          </Link>
        </div>
      </section>
    </main>
  );
}