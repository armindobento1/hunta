import { Clock3, Crosshair, MapPin, Target } from "lucide-react";

import type { Kill } from "@/lib/domain/kill";

function weaponDetail(kill: Kill): string {
  return kill.weapon.type === "rifle" ? kill.weapon.caliber : kill.weapon.bowType;
}

export function HuntFacts({ kill }: { kill: Kill }) {
  return (
    <dl className="hunt-facts">
      <div>
        <Target aria-hidden="true" />
        <dt>Weapon</dt>
        <dd>{kill.weapon.model}</dd>
        <span>{weaponDetail(kill)}</span>
      </div>
      <div>
        <Crosshair aria-hidden="true" />
        <dt>Ammunition</dt>
        <dd>{kill.ammunition.grain} grain</dd>
        <span>{[kill.ammunition.brand, kill.ammunition.detail].filter(Boolean).join(" · ") || "No extra detail"}</span>
      </div>
      <div>
        <Clock3 aria-hidden="true" />
        <dt>Exact time</dt>
        <dd>{kill.killTime}</dd>
        <span>{kill.date}</span>
      </div>
      <div>
        <MapPin aria-hidden="true" />
        <dt>Location</dt>
        <dd>{kill.location.placeName}</dd>
        <span>
          {kill.location.latitude.toFixed(5)}, {kill.location.longitude.toFixed(5)}
        </span>
      </div>
    </dl>
  );
}
