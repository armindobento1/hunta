import { screen } from "@testing-library/react";

import { LeaderboardView } from "@/components/portfolio/leaderboard-view";
import { PortfolioMap } from "@/components/portfolio/portfolio-map";
import { makeKill } from "@/tests/helpers/kill";
import { renderWithRouter } from "@/tests/helpers/render-router";

describe("private exploration views", () => {
  it("ranks only factual scores from the owner's records", () => {
    const measured = makeKill({
      id: "measured",
      measurement: {
        score: 56.875,
        scoreUnit: "in",
        scoringSystem: "SCI",
      },
    });
    const unmeasured = makeKill({ id: "unmeasured", species: "Impala" });

    renderWithRouter(<LeaderboardView kills={[unmeasured, measured]} />);

    expect(screen.getByRole("heading", { name: /personal bests/i })).toBeInTheDocument();
    expect(screen.getByText("56 7/8 in")).toBeInTheDocument();
    expect(screen.queryByText(/@willem|@hendrik/i)).not.toBeInTheDocument();
  });

  it("shows an honest empty map state when no private records exist", () => {
    renderWithRouter(<PortfolioMap kills={[]} />);

    expect(screen.getByRole("heading", { name: /hunt map/i })).toBeInTheDocument();
    expect(screen.getByText(/no locations to map yet/i)).toBeInTheDocument();
  });
});
