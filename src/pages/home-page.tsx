import { Link } from "react-router-dom";

import { AuthRedirect } from "@/components/auth/auth-redirect";
import { BrandMark } from "@/components/brand/brand-mark";

export function HomePage() {
  return (
    <main className="welcome-shell">
      <AuthRedirect />
      <div className="welcome-glow" aria-hidden="true" />
      <section className="welcome-copy">
        <p className="eyebrow">Hunting portfolio community</p>
        <h1>Your hunts, remembered.</h1>
        <p>
          Keep every photograph, exact detail, and route together. Publish the
          hunts you choose, discover hunters, and follow their portfolios.
        </p>
        <Link className="primary-link" to="/auth">
          Get started
        </Link>
      </section>
      <aside className="welcome-mark" aria-label="Hunta">
        <BrandMark />
      </aside>
    </main>
  );
}
