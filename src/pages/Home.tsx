import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { TierBadge } from '../components/TierBadge';
import { TIER_ORDER, TIERS } from '../constants/tiers';
import { useAuth } from '../hooks/useAuth';
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

function YesNo({ yes }: { yes: boolean }) {
  return <span className={yes ? 'yn yes' : 'yn no'}>{yes ? 'Yes' : 'No'}</span>;
}

export function Home() {
  const { user } = useAuth();
  const canPostJobs = !user || user.role === 'client' || ((user.role === 'designer' || user.role === 'pee_reviewer') && user.verification === 'verified');

  // Clients (and visitors) come to post work. Designers and admins come to find it.
  const audience =
    canPostJobs
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
          <h1>Electrical projects, coordinated with clarity.</h1>
          <p className="lead">
            Connect with verified EE professionals, turn technical needs into clear project scopes, and keep every
            proposal, update, and handoff in one organized workspace.
          </p>
          <div className="action-row">
            <Link className="btn btn-primary btn-lg" to={audience.primary.to}>
              {audience.primary.label}
            </Link>
            <Link className="btn btn-secondary btn-lg" to={audience.secondary.to}>
              {audience.secondary.label}
            </Link>
          </div>
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