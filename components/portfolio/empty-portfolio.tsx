import { ArrowUpRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyPortfolio() {
  return (
    <section className="empty-portfolio">
      <span className="empty-icon" aria-hidden="true">
        <Camera />
      </span>
      <p className="eyebrow">No records yet</p>
      <h2>Your first hunt record starts here.</h2>
      <p>
        Add the photograph, exact facts, and route from a hunt. Nothing is
        shared publicly.
      </p>
      <Link className="empty-action" to="/portfolio/kills/new">
        Record a hunt <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
