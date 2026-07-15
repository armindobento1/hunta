import { Outlet, type RouteObject, useRoutes } from "react-router-dom";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthPage } from "@/src/pages/auth-page";
import { EditKillPage } from "@/src/pages/edit-kill-page";
import { DiscoverPage } from "@/src/pages/discover-page";
import { HomeFeedPage } from "@/src/pages/home-feed-page";
import { HomePage } from "@/src/pages/home-page";
import { HuntCommentsPage } from "@/src/pages/hunt-comments-page";
import { HuntLikersPage } from "@/src/pages/hunt-likers-page";
import { KillDetailPage } from "@/src/pages/kill-detail-page";
import { LeaderboardPage } from "@/src/pages/leaderboard-page";
import { LoadoutBuilderPage } from "@/src/pages/loadout-builder-page";
import { NewKillPage } from "@/src/pages/new-kill-page";
import { NotFoundPage } from "@/src/pages/not-found-page";
import { NotificationsPage } from "@/src/pages/notifications-page";
import { PortfolioPage } from "@/src/pages/portfolio-page";
import { PortfolioMapPage } from "@/src/pages/portfolio-map-page";
import { ProfilePage } from "@/src/pages/profile-page";
import { TrashPage } from "@/src/pages/trash-page";
import { PortfolioDataProvider } from "@/src/providers/portfolio-data-provider";
import { PublicProfilePage } from "@/src/pages/public-profile-page";
import { FollowListPage } from "@/src/pages/follow-list-page";
import { PublicHuntPage } from "@/src/pages/public-hunt-page";
import { SocialDataProvider } from "@/src/providers/social-data-provider";
import { SOCIAL_ENABLED } from "@/lib/features";

function PrivateRoutes() {
  return (
    <AuthGuard>
      <PortfolioDataProvider>
        {SOCIAL_ENABLED ? <SocialDataProvider><Outlet /></SocialDataProvider> : <Outlet />}
      </PortfolioDataProvider>
    </AuthGuard>
  );
}

// World-facing social routes; excluded from the private-only build.
const PUBLIC_SOCIAL_ROUTES: RouteObject[] = [
  { id: "public-profile", path: "/people/:uid", element: <PublicProfilePage /> },
  { id: "public-followers", path: "/people/:uid/followers", element: <FollowListPage kind="followers" /> },
  { id: "public-following", path: "/people/:uid/following", element: <FollowListPage kind="following" /> },
  { id: "public-hunt", path: "/people/:uid/hunts/:publicHuntId", element: <PublicHuntPage /> },
  { id: "public-hunt-likes", path: "/people/:uid/hunts/:publicHuntId/likes", element: <HuntLikersPage /> },
  { id: "public-hunt-comments", path: "/people/:uid/hunts/:publicHuntId/comments", element: <HuntCommentsPage /> },
  // No /farms route: the public farm directory is retired (audit v1.1 F-01) —
  // public hunts carry farm name + area as text only.
];

// Signed-in routes that consume SocialDataProvider; the leaderboard page
// renders the public community leaderboard, so it is social too.
const PRIVATE_SOCIAL_ROUTES: RouteObject[] = [
  { id: "home-feed", path: "/home", element: <HomeFeedPage /> },
  { id: "discover", path: "/discover", element: <DiscoverPage /> },
  { id: "notifications", path: "/notifications", element: <NotificationsPage /> },
  {
    id: "leaderboard",
    path: "/portfolio/leaderboard",
    element: <LeaderboardPage />,
  },
];

export const APP_ROUTES: RouteObject[] = [
  { id: "home", path: "/", element: <HomePage /> },
  { id: "auth", path: "/auth", element: <AuthPage /> },
  ...(SOCIAL_ENABLED ? PUBLIC_SOCIAL_ROUTES : []),
  {
    id: "private",
    element: <PrivateRoutes />,
    children: [
      ...(SOCIAL_ENABLED ? PRIVATE_SOCIAL_ROUTES : []),
      { id: "portfolio", path: "/portfolio", element: <PortfolioPage /> },
      {
        id: "portfolio-map",
        path: "/portfolio/map",
        element: <PortfolioMapPage />,
      },
      {
        id: "loadout-new",
        path: "/portfolio/loadouts/new",
        element: <LoadoutBuilderPage />,
      },
      {
        id: "loadout-edit",
        path: "/portfolio/loadouts/:loadoutId",
        element: <LoadoutBuilderPage />,
      },
      {
        id: "kill-new",
        path: "/portfolio/kills/new",
        element: <NewKillPage />,
      },
      {
        id: "kill-detail",
        path: "/portfolio/kills/:killId",
        element: <KillDetailPage />,
      },
      {
        id: "kill-edit",
        path: "/portfolio/kills/:killId/edit",
        element: <EditKillPage />,
      },
      {
        id: "profile",
        path: "/portfolio/profile",
        element: <ProfilePage />,
      },
      { id: "trash", path: "/portfolio/trash", element: <TrashPage /> },
    ],
  },
  { id: "not-found", path: "*", element: <NotFoundPage /> },
];

export function AppRoutes() {
  return useRoutes(APP_ROUTES);
}
