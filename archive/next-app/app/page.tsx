import Link from "next/link";

export default function HomePage() {
  return (
    <main className="welcome-shell">
      <div className="welcome-glow" aria-hidden="true" />
      <section className="welcome-copy">
        <p className="eyebrow">Private hunting portfolio</p>
        <h1>Your hunts, remembered.</h1>
        <p>
          Keep every photograph, exact detail, and route together. Your
          portfolio stays private to your account.
        </p>
        <Link className="primary-link" href="/auth">
          Get started
        </Link>
      </section>
      <aside className="welcome-mark" aria-label="Hunta">
        <span>H</span>
      </aside>
    </main>
  );
}
