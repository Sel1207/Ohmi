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

interface Step {
  title: string;
  text: string;
}

const clientSteps: Step[] = [
  {
    title: 'Post a job',
    text: 'Choose the project and building type, set a budget range, and fill in the technical details. Anything you do not know yet can be marked "I do not know yet".',
  },
  {
    title: 'Review proposals',
    text: 'Designers reply with a price, a timeline, and a note. Each proposal shows the designer\'s license tier, verification status, and past ratings.',
  },
  {
    title: 'Accept one proposal',
    text: 'Accepting a proposal creates a project and closes the job. The other proposals are declined automatically.',
  },
  {
    title: 'Complete and rate',
    text: 'Mark the project complete when the work is done. The client can then leave a star rating and a short review.',
  },
];

const designerSteps: Step[] = [
  {
    title: 'Sign up with your license tier',
    text: 'Choose Student Practitioner, RME, REE, or PEE. Licensed tiers enter a PRC number and start as pending.',
  },
  {
    title: 'Get verified',
    text: 'An Ohmi admin reviews the credentials associated with licensed tiers before you can bid, helping clients understand each practitioner\'s qualifications.',
  },
  {
    title: 'Find work that fits your tier',
    text: 'Design and load calculation jobs need a tier that can design. RMEs bid on installation and maintenance, and students are limited to small practice jobs.',
  },
  {
    title: 'Send a proposal',
    text: 'Set your price, timeline, and a short note. If the client accepts, the job becomes a project on your dashboard.',
  },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="step-list">
      {steps.map((step) => (
        <li key={step.title}>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function About() {
  return (
    <main className="page prose-page wide">
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
        <h2>How it works</h2>
        <p className="lead">Two sides of the same job. Here is what each one does, in order.</p>
        <div className="steps-columns">
          <section>
            <h3 className="steps-title">For clients</h3>
            <StepList steps={clientSteps} />
            <Link className="btn btn-primary" to="/jobs/new">
              Post a job
            </Link>
          </section>

          <section>
            <h3 className="steps-title">For designers</h3>
            <StepList steps={designerSteps} />
            <Link className="btn btn-secondary" to="/marketplace">
              Browse open jobs
            </Link>
          </section>
        </div>
      </section>

      <section className="content-section">
        <h2>Where Ohmi is today</h2>
        <p className="muted">
          Ohmi is an early prototype. Accounts, jobs, and proposals are saved in your browser only, payments are not
          connected, and PRC licenses are checked by an admin rather than against a registry.
        </p>
        <div className="action-row">
          <Link className="btn btn-secondary" to="/marketplace">
            Browse the marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}