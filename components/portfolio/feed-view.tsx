import { KillCard } from "./kill-card";
import type { Kill } from "@/lib/domain/kill";
import { cn } from "@/lib/ui/cn";

export function FeedView({
  kills,
  display,
}: {
  kills: Kill[];
  display: "list" | "grid";
}) {
  return (
    <div
      className={cn("feed-view", display === "grid" && "feed-grid")}
      data-testid="feed-view"
    >
      {kills.map((kill) => (
        <KillCard
          key={kill.id}
          kill={kill}
          variant={display === "grid" ? "grid" : "overlay"}
        />
      ))}
    </div>
  );
}
