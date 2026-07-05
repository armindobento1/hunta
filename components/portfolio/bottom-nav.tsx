import { BarChart3, Home, MapPin, Plus, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function isActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function BottomNav() {
  const { pathname } = useLocation();
  const feedActive =
    pathname === "/portfolio" || pathname.startsWith("/portfolio/kills/");

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <Link className={`tab-item${feedActive ? " tab-active" : ""}`} to="/portfolio">
        <Home aria-hidden="true" />
        <span>Feed</span>
      </Link>
      <Link
        className={`tab-item${isActive(pathname, "/portfolio/leaderboard") ? " tab-active" : ""}`}
        to="/portfolio/leaderboard"
      >
        <BarChart3 aria-hidden="true" />
        <span>Leaders</span>
      </Link>
      <Link className="tab-fab" to="/portfolio/kills/new" aria-label="Log a kill">
        <Plus aria-hidden="true" />
      </Link>
      <Link
        className={`tab-item${isActive(pathname, "/portfolio/map") ? " tab-active" : ""}`}
        to="/portfolio/map"
      >
        <MapPin aria-hidden="true" />
        <span>Map</span>
      </Link>
      <Link
        className={`tab-item${isActive(pathname, "/portfolio/profile") ? " tab-active" : ""}`}
        to="/portfolio/profile"
      >
        <UserRound aria-hidden="true" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
