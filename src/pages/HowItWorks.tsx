import { Link } from 'react-router-dom';

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

export function HowItWorks() {
  return (
    <main className="page prose-page wide">
      <header className="content-header">
        <h1>How it works</h1>
        <p className="lead">Two sides of the same job. Here is what each one does, in order.</p>
      </header>

      <div className="steps-columns">
        <section>
          <h2 className="steps-title">For clients</h2>
          <StepList steps={clientSteps} />
          <Link className="btn btn-primary" to="/jobs/new">
            Post a job
          </Link>
        </section>

        <section>
          <h2 className="steps-title">For designers</h2>
          <StepList steps={designerSteps} />
          <Link className="btn btn-secondary" to="/marketplace">
            Browse open jobs
          </Link>
        </section>
      </div>
    </main>
  );
}