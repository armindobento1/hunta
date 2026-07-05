import { Navigate } from "react-router-dom";

import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Sends an authenticated visitor from the auth screen to their portfolio.
 * Without this, a successful Google/email sign-in updates auth state but
 * leaves the user sitting on the login screen.
 */
export function AuthRedirect() {
  const { user, loading } = useAuth();
  return !loading && user ? <Navigate replace to="/portfolio" /> : null;
}
