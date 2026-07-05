import { groupKillsByLocation } from "@/lib/domain/selectors";
import type { Kill } from "@/lib/domain/kill";

import { KillCard } from "./kill-card";

export function LocationView({ kills }: { kills: Kill[] }) {
  const groups = groupKillsByLocation(kills);

  return (
    <div className="location-groups">
      {Object.entries(groups).map(([country, places]) => (
        <section className="country-group" key={country}>
          <div className="country-heading">
            <div>
              <p>Country</p>
              <h2>{country}</h2>
            </div>
            <span>
              {Object.values(places).reduce(
                (total, years) =>
                  total +
                  Object.values(years).reduce(
                    (yearTotal, records) => yearTotal + records.length,
                    0,
                  ),
                0,
              )}{" "}
              hunts
            </span>
          </div>
          {Object.entries(places).map(([place, years]) => (
            <div className="place-group" key={place}>
              <h3>{place}</h3>
              {Object.entries(years).map(([year, records]) => (
                <div className="year-group" key={year}>
                  <p>{year}</p>
                  <div>
                    {records.map((kill) => (
                      <KillCard key={kill.id} kill={kill} variant="compact" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
