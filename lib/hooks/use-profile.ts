import { usePortfolioData } from "@/src/providers/portfolio-data-provider";

export function useProfile() {
  return usePortfolioData().profileState;
}
