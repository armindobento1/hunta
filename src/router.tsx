import { Outlet, type RouteObject, useRoutes } from "react-router-dom";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthPage } from "@/src/pages/auth-page";
import { EditKillPage } from "@/src/pages/edit-kill-page";
import { DiscoverPage } from "@/src/pages/discover-page";
import { HomeFeedPage } from "@/src/pages/home-feed-page";
import { HomePage } from "@/src/pages/home-page";
import { KillDetailPage } from "@/src/pages/kill-detail-page";
import { LeaderboardPage } from "@/src/pages/leaderboard-page";
import { NewKillPage } from "@/src/pages/new-kill-page";
import { NotFoundPage } from "@/src/pages/not-found-page";
import { PortfolioPage } from "@/src/pages/portfolio-page";
import { PortfolioMapPage } from "@/src/pages/portfolio-map-page";
import { ProfilePage } from "@/src/pages/profile-page";
import { TrashPage } from "@/src/pages/trash-page";
import { PortfolioDataProvider } from "@/src/providers/portfolio-data-provider";
import { PublicProfilePage } from "@/src/pages/public-profile-page";
import { FarmPage } from "@/src/pages/farm-page";
import { PublicHuntPage } from "@/src/pages/public-hunt-page";
import { SocialDataProvider } from "@/src/providers/social-data-provider";

function PrivateRoutes() {
  return (
    <AuthGuard>
      <PortfolioDataProvider>
        <SocialDataProvider><Outlet /></SocialDataProvider>
      </PortfolioDataProvider>
    </AuthGuard>
  );
}

export const APP_ROUTES: RouteObject[] = [
  { id: "home", path: "/", element: <HomePage /> },
  { id: "auth", path: "/auth", element: <AuthPage /> },
  { id: "public-profile", path: "/people/:uid", element: <PublicProfilePage /> },
  { id: "public-hunt", path: "/people/:uid/hunts/:publicHuntId", element: <PublicHuntPage /> },
  { id: "farm", path: "/farms/:farmId", element: <FarmPage /> },
  {
    id: "private",
    element: <PrivateRoutes />,
    children: [
      { id: "home-feed", path: "/home", element: <HomeFeedPage /> },
      { id: "discover", path: "/discover", element: <DiscoverPage /> },
      { id: "portfolio", path: "/portfolio", element: <PortfolioPage /> },
      {
        id: "leaderboard",
        path: "/portfolio/leaderboard",
        element: <LeaderboardPage />,
      },
      {
        id: "portfolio-map",
        path: "/portfolio/map",
        element: <PortfolioMapPage />,
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
