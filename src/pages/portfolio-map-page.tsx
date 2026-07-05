import { BottomNav } from "@/components/portfolio/bottom-nav";
import { PortfolioMap } from "@/components/portfolio/portfolio-map";
import { Spinner } from "@/components/ui/spinner";
import { useKills } from "@/lib/hooks/use-kills";

export function PortfolioMapPage() {
  const { kills, loading, error } = useKills();
  if (loading) return <main className="centered-state"><Spinner label="Loading hunt map" /></main>;
  if (error) return <main className="centered-state"><p role="alert">{error}</p></main>;
  return <main className="portfolio-shell"><PortfolioMap kills={kills} /><BottomNav /></main>;
}
