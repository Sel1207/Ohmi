import { Link } from 'react-router-dom';

const capabilities = [
  {
    title: 'Find the right license',
    text: 'Compare designers by tier, portfolio, location, and reviews before you talk to anyone.',
  },
  {
    title: 'Describe the job once',
    text: 'A structured form captures the technical details, with plain-language help for anything you do not know yet.',
  },
  {
    title: 'Move from bid to project',
    text: 'Accepting a proposal creates a project you can follow through to completion and a rating.',
  },
];

const audiences = [
  {
    title: 'Clients',
    text: 'Homeowners, shop owners, and building administrators who need electrical work scoped, priced, and done properly.',
  },
  {
    title: 'Designers',
    text: 'Student practitioners building a portfolio, Registered Master Electricians for installation and maintenance, and Registered Electrical Engineers for design and load calculation.',
  },
  {
    title: 'PEE reviewers',
    text: 'Professional Electrical Engineers, the senior tier and the only one with authority to seal plans.',
  },
];

export function About() {
  return (
    <main className="page prose-page">
      <header className="content-header">
        <h1>About Ohmi</h1>
        <p className="lead">
          Electrical work is technical, and hiring for it should not be guesswork. Ohmi gives clients a clear way to
          describe a job and gives engineers enough context to price it responsibly.
        </p>
      </header>

      <section className="content-section">
        <h2>What Ohmi does</h2>
        <dl className="about-list">
          {capabilities.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="content-section">
        <h2>Who it is for</h2>
        <dl className="about-list">
          {audiences.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="content-section">
        <h2>Where Ohmi is today</h2>
        <p className="muted">
          Ohmi is an early prototype. Accounts, jobs, and proposals are saved in your browser only, payments are not
          connected, and PRC licenses are checked by an admin rather than against a registry.
        </p>
        <div className="action-row">
          <Link className="btn btn-primary" to="/how-it-works">
            See how it works
          </Link>
          <Link className="btn btn-secondary" to="/marketplace">
            Browse the marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}