import { matchRoutes } from "react-router-dom";

import { APP_ROUTES } from "@/src/router";

describe("Hunta route tree", () => {
  it.each([
    ["/", "home"],
    ["/auth", "auth"],
    ["/portfolio", "portfolio"],
    ["/portfolio/kills/new", "kill-new"],
    ["/portfolio/kills/kill-123", "kill-detail"],
    ["/portfolio/kills/kill-123/edit", "kill-edit"],
    ["/portfolio/profile", "profile"],
    ["/portfolio/leaderboard", "leaderboard"],
    ["/portfolio/map", "portfolio-map"],
    ["/portfolio/trash", "trash"],
    ["/missing", "not-found"],
  ])("matches %s to %s", (path, expectedRouteId) => {
    const matches = matchRoutes(APP_ROUTES, path);

    expect(matches?.at(-1)?.route.id).toBe(expectedRouteId);
  });
});
