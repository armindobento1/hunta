import { lazy, Suspense, type ReactNode } from "react";
import { Outlet, type RouteObject, useRoutes } from "react-router-dom";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Spinner } from "@/components/ui/spinner";
import { SOCIAL_ENABLED } from "@/lib/features";

const AuthPage = lazy(() => import("@/src/pages/auth-page").then((module) => ({ default: module.AuthPage })));
const DiscoverPage = lazy(() => import("@/src/pages/discover-page").then((module) => ({ default: module.DiscoverPage })));
const EditKillPage = lazy(() => import("@/src/pages/edit-kill-page").then((module) => ({ default: module.EditKillPage })));
const FollowListPage = lazy(() => import("@/src/pages/follow-list-page").then((module) => ({ default: module.FollowListPage })));
const HomeFeedPage = lazy(() => import("@/src/pages/home-feed-page").then((module) => ({ default: module.HomeFeedPage })));
const HomePage = lazy(() => import("@/src/pages/home-page").then((module) => ({ default: module.HomePage })));
const HuntCommentsPage = lazy(() => import("@/src/pages/hunt-comments-page").then((module) => ({ default: module.HuntCommentsPage })));
const HuntLikersPage = lazy(() => import("@/src/pages/hunt-likers-page").then((module) => ({ default: module.HuntLikersPage })));
const KillDetailPage = lazy(() => import("@/src/pages/kill-detail-page").then((module) => ({ default: module.KillDetailPage })));
const LeaderboardPage = lazy(() => import("@/src/pages/leaderboard-page").then((module) => ({ default: module.LeaderboardPage })));
const LoadoutBuilderPage = lazy(() => import("@/src/pages/loadout-builder-page").then((module) => ({ default: module.LoadoutBuilderPage })));
const NewKillPage = lazy(() => import("@/src/pages/new-kill-page").then((module) => ({ default: module.NewKillPage })));
const NotFoundPage = lazy(() => import("@/src/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const NotificationsPage = lazy(() => import("@/src/pages/notifications-page").then((module) => ({ default: module.NotificationsPage })));
const PortfolioMapPage = lazy(() => import("@/src/pages/portfolio-map-page").then((module) => ({ default: module.PortfolioMapPage })));
const PortfolioPage = lazy(() => import("@/src/pages/portfolio-page").then((module) => ({ default: module.PortfolioPage })));
const ProfilePage = lazy(() => import("@/src/pages/profile-page").then((module) => ({ default: module.ProfilePage })));
const PublicHuntPage = lazy(() => import("@/src/pages/public-hunt-page").then((module) => ({ default: module.PublicHuntPage })));
const PublicProfilePage = lazy(() => import("@/src/pages/public-profile-page").then((module) => ({ default: module.PublicProfilePage })));
const TrashPage = lazy(() => import("@/src/pages/trash-page").then((module) => ({ default: module.TrashPage })));
const PortfolioDataProvider = lazy(() => import("@/src/providers/portfolio-data-provider").then((module) => ({ default: module.PortfolioDataProvider })));
const SocialDataProvider = lazy(() => import("@/src/providers/social-data-provider").then((module) => ({ default: module.SocialDataProvider })));

function PrivateRoutes() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
}

function PortfolioDataRoute({ children, profile = false, kills = false, armory = false }: {
  children: ReactNode;
  profile?: boolean;
  kills?: boolean;
  armory?: boolean;
}) {
  return (
    <PortfolioDataProvider needs={{ profile, kills, armory }}>
      {children}
    </PortfolioDataProvider>
  );
}

function PrivateSocialRoutes() {
  return (
    <SocialDataProvider>
      <Outlet />
    </SocialDataProvider>
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

const PRIVATE_PORTFOLIO_ROUTES: RouteObject[] = [
  {
    id: "portfolio",
    path: "/portfolio",
    element: <PortfolioDataRoute profile kills armory><PortfolioPage /></PortfolioDataRoute>,
  },
  {
    id: "portfolio-map",
    path: "/portfolio/map",
    element: <PortfolioDataRoute kills><PortfolioMapPage /></PortfolioDataRoute>,
  },
  {
    id: "loadout-new",
    path: "/portfolio/loadouts/new",
    element: <PortfolioDataRoute armory><LoadoutBuilderPage /></PortfolioDataRoute>,
  },
  {
    id: "loadout-edit",
    path: "/portfolio/loadouts/:loadoutId",
    element: <PortfolioDataRoute armory><LoadoutBuilderPage /></PortfolioDataRoute>,
  },
  {
    id: "kill-new",
    path: "/portfolio/kills/new",
    element: <PortfolioDataRoute profile armory><NewKillPage /></PortfolioDataRoute>,
  },
  {
    id: "kill-detail",
    path: "/portfolio/kills/:killId",
    element: <KillDetailPage />,
  },
  {
    id: "kill-edit",
    path: "/portfolio/kills/:killId/edit",
    element: <PortfolioDataRoute profile armory><EditKillPage /></PortfolioDataRoute>,
  },
  {
    id: "profile",
    path: "/portfolio/profile",
    element: <PortfolioDataRoute profile><ProfilePage /></PortfolioDataRoute>,
  },
  {
    id: "trash",
    path: "/portfolio/trash",
    element: <PortfolioDataRoute kills><TrashPage /></PortfolioDataRoute>,
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
      ...(SOCIAL_ENABLED
        ? [{ id: "private-social", element: <PrivateSocialRoutes />, children: PRIVATE_SOCIAL_ROUTES }]
        : []),
      ...PRIVATE_PORTFOLIO_ROUTES,
    ],
  },
  { id: "not-found", path: "*", element: <NotFoundPage /> },
];

export function AppRoutes() {
  const routes = useRoutes(APP_ROUTES);
  return (
    <Suspense fallback={<main className="centered-state"><Spinner label="Loading page" /></main>}>
      {routes}
    </Suspense>
  );
}
