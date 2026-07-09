import { Compass, Home, MapPin, Plus, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function isActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function BottomNav() {
  const { pathname } = useLocation();
  const profileActive =
    pathname === "/portfolio" ||
    pathname.startsWith("/portfolio/profile") ||
    pathname.startsWith("/portfolio/kills/");

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <Link className={`tab-item${isActive(pathname, "/home") ? " tab-active" : ""}`} to="/home">
        <Home aria-hidden="true" />
        <span>Home</span>
      </Link>
      <Link
        className={`tab-item${isActive(pathname, "/discover") ? " tab-active" : ""}`}
        to="/discover"
      >
        <Compass aria-hidden="true" />
        <span>Discover</span>
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
        className={`tab-item${profileActive ? " tab-active" : ""}`}
        to="/portfolio"
      >
        <UserRound aria-hidden="true" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
