import { Grid2X2, Plus, UserRound } from "lucide-react";
import Link from "next/link";

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <Link href="/portfolio">
        <Grid2X2 aria-hidden="true" />
        <span>Portfolio</span>
      </Link>
      <Link className="add-record" href="/portfolio/kills/new" aria-label="Add hunt">
        <Plus aria-hidden="true" />
      </Link>
      <Link href="/portfolio/profile">
        <UserRound aria-hidden="true" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
