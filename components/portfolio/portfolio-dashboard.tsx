"use client";

import { Grid2X2, List } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";

import type { Kill } from "@/lib/domain/kill";
import type { Profile } from "@/lib/domain/profile";
import {
  getPortfolioStats,
  sortActiveKills,
} from "@/lib/domain/selectors";

import { BottomNav } from "./bottom-nav";
import { ArmoryView } from "./armory-view";
import { EmptyPortfolio } from "./empty-portfolio";
import { FeedView } from "./feed-view";
import { LocationView } from "./location-view";
import { ProfileHeader, type PortfolioTab } from "./profile-header";

export function PortfolioDashboard({
  profile,
  kills,
}: {
  profile: Profile;
  kills: Kill[];
}) {
  const location = useLocation();
  const [tab, setTab] = useState<PortfolioTab>(
    (location.state as { tab?: PortfolioTab } | null)?.tab ?? "feed",
  );
  const [display, setDisplay] = useState<"list" | "grid">("list");
  const activeKills = sortActiveKills(kills);

  return (
    <main className="portfolio-shell">
      <div className="portfolio-content">
        <ProfileHeader
          profile={profile}
          stats={getPortfolioStats(kills)}
          activeTab={tab}
          onTabChange={setTab}
        />
        {tab === "armory" ? <ArmoryView /> : tab === "feed" ? (
          <>
            {activeKills.length === 0 ? <EmptyPortfolio /> : <>
            <div className="feed-toolbar">
              <span>{activeKills.length} animals</span>
              <div aria-label="Feed display">
                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={display === "list"}
                  onClick={() => setDisplay("list")}
                >
                  <List />
                </button>
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={display === "grid"}
                  onClick={() => setDisplay("grid")}
                >
                  <Grid2X2 />
                </button>
              </div>
            </div>
            <FeedView display={display} kills={activeKills} />
            </>}
          </>
        ) : activeKills.length === 0 ? <EmptyPortfolio /> : <LocationView kills={activeKills} />}
      </div>
      <BottomNav />
    </main>
  );
}
