import { BrandLogo } from "./brand-logo";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark${compact ? " brand-mark-compact" : ""}`}>
      <BrandLogo label="" size="100%" />
      <span className="sr-only">H</span>
    </span>
  );
}
