export function PortfolioTabs({
  active,
  onChange,
}: {
  active: "feed" | "location";
  onChange(value: "feed" | "location"): void;
}) {
  return (
    <div className="segmented-control" aria-label="Portfolio view">
      <button
        type="button"
        aria-pressed={active === "feed"}
        onClick={() => onChange("feed")}
      >
        Feed
      </button>
      <button
        type="button"
        aria-pressed={active === "location"}
        onClick={() => onChange("location")}
      >
        By location
      </button>
    </div>
  );
}
