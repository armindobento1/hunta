import type { Kill } from "@/lib/domain/kill";

import { GearSpec, type SpecRow } from "./gear-spec";

export function HuntFacts({ kill }: { kill: Kill }) {
  const extra: SpecRow[] = [
    { label: "Exact time", value: kill.killTime, sub: kill.date },
    {
      label: "Location",
      value: kill.location.farmName || kill.location.placeName,
      sub: `${kill.location.latitude.toFixed(5)}, ${kill.location.longitude.toFixed(5)}`,
    },
  ];
  return (
    <section className="facts-card" aria-label="Gear and facts">
      <GearSpec
        weapon={kill.weapon}
        ammunition={kill.ammunition}
        attachments={kill.equipmentAttachments}
        extra={extra}
      />
    </section>
  );
}
