import mark from "@/src/assets/brand/head-clean.png";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark${compact ? " brand-mark-compact" : ""}`}>
      <img src={mark} alt="" aria-hidden="true" />
      <span className="sr-only">H</span>
    </span>
  );
}
