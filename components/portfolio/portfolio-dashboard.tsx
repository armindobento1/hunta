"use client";

import { Grid2X2, List } from "lucide-react";
import { useState } from "react";

import type { Kill } from "@/lib/domain/kill";
import type { Profile } from "@/lib/domain/profile";
import {
  getPortfolioStats,
  sortActiveKills,
} from "@/lib/domain/selectors";

import { BottomNav } from "./bottom-nav";
import { EmptyPortfolio } from "./empty-portfolio";
import { FeedView } from "./feed-view";
import { LocationView } from "./location-view";
import { PortfolioTabs } from "./portfolio-tabs";
import { ProfileHeader } from "./profile-header";

export function PortfolioDashboard({
  profile,
  kills,
}: {
  profile: Profile;
  kills: Kill[];
}) {
  const [tab, setTab] = useState<"feed" | "location">("feed");
  const [display, setDisplay] = useState<"list" | "grid">("list");
  const activeKills = sortActiveKills(kills);

  return (
    <main className="portfolio-shell">
      <div className="portfolio-content">
        <ProfileHeader profile={profile} stats={getPortfolioStats(kills)} />
        <PortfolioTabs active={tab} onChange={setTab} />
        {activeKills.length === 0 ? (
          <EmptyPortfolio />
        ) : tab === "feed" ? (
          <>
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
          </>
        ) : (
          <LocationView kills={activeKills} />
        )}
      </div>
      <BottomNav />
    </main>
  );
}
