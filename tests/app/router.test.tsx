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
    ["/portfolio/map", "portfolio-map"],
    ["/portfolio/trash", "trash"],
    ["/missing", "not-found"],
    // The private-only build (VITE_SOCIAL_ENABLED off) must not route any
    // public/social surface — audit v1.1 F-01/F-05 containment.
    ["/home", "not-found"],
    ["/discover", "not-found"],
    ["/notifications", "not-found"],
    ["/portfolio/leaderboard", "not-found"],
    ["/people/hunter-1", "not-found"],
    ["/people/hunter-1/hunts/hunter-1_kill-1", "not-found"],
    ["/farms/farm-1", "not-found"],
  ])("matches %s to %s", (path, expectedRouteId) => {
    const matches = matchRoutes(APP_ROUTES, path);

    expect(matches?.at(-1)?.route.id).toBe(expectedRouteId);
  });
});
