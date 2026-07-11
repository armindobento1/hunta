import { Navigate } from "react-router-dom";

import { SOCIAL_ENABLED } from "@/lib/features";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Sends an authenticated visitor from the auth screen into the app.
 * Without this, a successful Google/email sign-in updates auth state but
 * leaves the user sitting on the login screen. The private-only build has
 * no social home feed, so it lands on the portfolio instead.
 */
export function AuthRedirect() {
  const { user, loading } = useAuth();
  return !loading && user ? <Navigate replace to={SOCIAL_ENABLED ? "/home" : "/portfolio"} /> : null;
}
