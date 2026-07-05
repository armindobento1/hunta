import { usePortfolioData } from "@/src/providers/portfolio-data-provider";

export function useKills() {
  return usePortfolioData().killsState;
}
