import { usePortfolioData } from "@/src/providers/portfolio-data-provider";

export function useArmory() {
  return usePortfolioData().armoryState;
}
