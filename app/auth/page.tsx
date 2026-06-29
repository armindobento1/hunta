import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";

export default function AuthPage() {
  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/" aria-label="Fieldnote home">
        F
      </Link>
      <div className="auth-landscape" aria-hidden="true">
        <div className="ridge ridge-back" />
        <div className="ridge ridge-front" />
        <p>Private by default.</p>
      </div>
      <AuthCard />
    </main>
  );
}
