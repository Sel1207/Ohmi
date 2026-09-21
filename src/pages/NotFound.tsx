import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <main className="page narrow-page">
      <section className="card empty-state">
        <h1>Page not found</h1>
        <p>The page may have moved, or the local demo data may have been reset.</p>
        <Link className="btn btn-primary" to="/marketplace">
          Go to marketplace
        </Link>
      </section>
    </main>
  );
}
