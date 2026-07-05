"use client";

import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard";
import { Spinner } from "@/components/ui/spinner";
import { useKills } from "@/lib/hooks/use-kills";
import { useProfile } from "@/lib/hooks/use-profile";

export default function PortfolioPage() {
  const profileState = useProfile();
  const killsState = useKills();
  const error = profileState.error || killsState.error;

  if (profileState.loading || killsState.loading) {
    return (
      <main className="centered-state">
        <Spinner label="Loading your portfolio" />
      </main>
    );
  }

  if (error || !profileState.profile) {
    return (
      <main className="centered-state">
        <p role="alert">{error || "Your profile is not available."}</p>
      </main>
    );
  }

  return (
    <PortfolioDashboard
      profile={profileState.profile}
      kills={killsState.kills}
    />
  );
}
