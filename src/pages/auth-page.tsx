import { Link } from "react-router-dom";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import { BrandMark } from "@/components/brand/brand-mark";

export function AuthPage() {
  return (
    <main className="auth-page">
      <AuthRedirect />
      <Link className="auth-brand" to="/" aria-label="Hunta home">
        <BrandMark compact />
      </Link>
      <p className="auth-privacy-note">Private by default.</p>
      <AuthCard />
    </main>
  );
}
