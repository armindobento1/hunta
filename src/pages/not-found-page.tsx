import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="centered-state">
      <div>
        <p className="eyebrow">Page not found</p>
        <h1>This trail ends here.</h1>
        <Link className="primary-link" to="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
