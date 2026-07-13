import type { Ammunition, EquipmentAttachments, Weapon } from "@/lib/domain/kill";

export interface SpecRow {
  label: string;
  value: string;
  sub?: string;
}

// Rendered in this order; only attachments actually present appear.
const ATTACHMENTS: [keyof EquipmentAttachments, string][] = [
  ["optic", "Optic"],
  ["suppressor", "Suppressor"],
  ["bipod", "Bipod"],
  ["sling", "Sling"],
  ["arrow", "Arrow"],
  ["broadhead", "Broadhead"],
];

function attachmentRows(attachments: EquipmentAttachments | undefined): SpecRow[] {
  if (!attachments) return [];
  const rows: SpecRow[] = [];
  for (const [key, label] of ATTACHMENTS) {
    const item = attachments[key];
    if (!item) continue;
    const sub = [item.detail, item.grain ? `${item.grain} gr` : null]
      .filter(Boolean)
      .join(" · ");
    rows.push({ label, value: item.name, sub: sub || undefined });
  }
  return rows;
}

/**
 * A clean, minimal label/value spec list of a hunt's gear and facts. Values
 * wrap instead of truncating, and every present attachment is shown — the
 * old grids clipped long calibres/models to an ellipsis and dropped
 * optic/suppressor/arrow/broadhead entirely. Theme-neutral (opacity-based
 * labels), so it reads correctly on both the light portfolio detail and the
 * dark public detail.
 */
export function GearSpec({
  weapon,
  ammunition,
  attachments,
  leading = [],
  extra = [],
}: {
  weapon: Weapon;
  ammunition: Ammunition;
  attachments?: EquipmentAttachments;
  leading?: SpecRow[];
  extra?: SpecRow[];
}) {
  const rows: SpecRow[] = [
    ...leading,
    {
      label: "Weapon",
      value: weapon.model,
      sub: weapon.type === "rifle" ? weapon.caliber : weapon.bowType,
    },
    {
      label: "Ammunition",
      value: `${ammunition.grain} grain`,
      sub: [ammunition.brand, ammunition.detail].filter(Boolean).join(" · ") || undefined,
    },
    ...attachmentRows(attachments),
    ...extra,
  ];

  return (
    <dl className="spec-list">
      {rows.map((row, index) => (
        <div className="spec-row" key={`${row.label}-${index}`}>
          <dt className="spec-label">{row.label}</dt>
          <dd className="spec-value">
            {row.value}
            {row.sub ? <small>{row.sub}</small> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
