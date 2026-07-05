import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthRedirect } from "@/components/auth/auth-redirect";

export default function AuthPage() {
  return (
    <main className="auth-page">
      <AuthRedirect />
      <Link className="auth-brand" href="/" aria-label="Hunta home">
        H
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
