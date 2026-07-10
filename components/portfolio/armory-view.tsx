import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AddGearSheet } from "@/components/armory/add-gear-sheet";
import { armoryItemSpec } from "@/components/armory/item-spec";
import { resolveLoadout, type ArmoryItem, type Loadout } from "@/lib/domain/armory";
import { deleteArmoryItem, deleteLoadout, setDefaultLoadout } from "@/lib/firebase/armory-repository";
import { useArmory } from "@/lib/hooks/use-armory";
import { useAuth } from "@/lib/hooks/use-auth";

const FILTERS: { id: "all" | ArmoryItem["kind"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "weapon", label: "Weapons" },
  { id: "optic", label: "Optics" },
  { id: "suppressor", label: "Suppressors" },
  { id: "ammunition", label: "Ammo" },
  { id: "arrow", label: "Arrows" },
  { id: "broadhead", label: "Broadheads" },
  { id: "bipod", label: "Bipods" },
  { id: "sling", label: "Slings" },
];

export function ArmoryView() {
  const { user } = useAuth();
  const { items, loadouts, loading, error } = useArmory();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | ArmoryItem["kind"]>("all");
  const [gearSheet, setGearSheet] = useState<{ kind?: ArmoryItem["kind"] } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) return <section className="arm-view"><p>Loading your armory…</p></section>;
  const visible = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const hasWeapon = items.some((item) => item.kind === "weapon");

  return (
    <section className="arm-view" aria-labelledby="armory-heading">
      <div className="arm-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="arm-eyebrow">PRIVATE EQUIPMENT LIBRARY</p>
          <h2 className="arm-title" id="armory-heading">Armory</h2>
        </div>
        {items.length > 0 ? (
          <button type="button" className="arm-pill" onClick={() => setGearSheet({})}>
            <span className="arm-plus" aria-hidden="true" /> Add gear
          </button>
        ) : null}
      </div>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}

      {items.length === 0 ? (
        <>
          <div className="arm-empty">
            <span className="arm-empty-reticle" aria-hidden="true"><span /><span /><span /><span /></span>
            <h2>Your armory is empty</h2>
            <p>Add a weapon first — optics, suppressors, ammunition and other attachments build on it.</p>
            <button type="button" className="arm-pill" style={{ marginTop: 12 }} onClick={() => setGearSheet({ kind: "weapon" })}>Add a weapon</button>
            <span className="arm-empty-kinds">RIFLE · BOW</span>
          </div>
          <div className="arm-steps">
            <div className="arm-step arm-step-live"><span className="arm-step-n">1</span>Add your weapons</div>
            <div className="arm-step"><span className="arm-step-n">2</span>Add attachments &amp; ammunition</div>
            <div className="arm-step"><span className="arm-step-n">3</span>Build loadouts &amp; attach them to hunts</div>
          </div>
        </>
      ) : (
        <>
          <div className="arm-chips" aria-label="Filter equipment">
            {FILTERS.map((entry) => (
              <button key={entry.id} type="button" className={`arm-chip${filter === entry.id ? " arm-chip-active" : ""}`} aria-pressed={filter === entry.id} onClick={() => setFilter(entry.id)}>
                {entry.label}
              </button>
            ))}
          </div>
          <div className="arm-meta-row">
            <span className="arm-meta">{items.length} items · {loadouts.length} loadouts</span>
          </div>
          <div className="arm-grid">
            {visible.map((item) => (
              <article className="arm-card" key={item.id}>
                <span className={`arm-tag${item.kind === "weapon" ? " arm-tag-weapon" : ""}`}>{item.kind === "weapon" ? item.weapon.type : item.kind}</span>
                <div>
                  <div className="arm-card-name">{item.name}</div>
                  {armoryItemSpec(item) ? <div className="arm-card-spec">{armoryItemSpec(item)}</div> : null}
                </div>
                <button
                  className="arm-card-x"
                  aria-label={`Delete ${item.name}`}
                  onClick={async () => {
                    if (!user || !confirm(`Delete ${item.name}?`)) return;
                    try {
                      await deleteArmoryItem(user.uid, item.id);
                    } catch (cause) {
                      setMessage(cause instanceof Error ? cause.message : "Could not delete equipment.");
                    }
                  }}
                >
                  ✕
                </button>
              </article>
            ))}
            <button type="button" className="arm-add-tile" onClick={() => setGearSheet({})}>
              <span className="arm-plus" aria-hidden="true" />Add gear
            </button>
          </div>

          <div className="arm-meta-row" style={{ marginTop: 26 }}>
            <span className="arm-meta">Loadouts</span>
            <button type="button" className="arm-pill" disabled={!hasWeapon} onClick={() => navigate("/portfolio/loadouts/new")}>
              <span className="arm-plus" aria-hidden="true" /> New
            </button>
          </div>
          {loadouts.length === 0 ? (
            <p className="sheet-sub">No loadouts yet — pick a weapon, then fill its attachment slots on the schematic.</p>
          ) : (
            <div className="arm-lo-list">
              {loadouts.map((loadout) => (
                <LoadoutCard
                  key={loadout.id}
                  loadout={loadout}
                  items={items}
                  onEdit={() => navigate(`/portfolio/loadouts/${loadout.id}`)}
                  onDefault={() => { if (user) void setDefaultLoadout(user.uid, loadout.id); }}
                  onDelete={() => { if (user && confirm(`Delete ${loadout.name}?`)) void deleteLoadout(user.uid, loadout.id); }}
                />
              ))}
            </div>
          )}
        </>
      )}
      {gearSheet && user ? (
        <AddGearSheet uid={user.uid} initialKind={gearSheet.kind} onClose={() => setGearSheet(null)} onSaved={() => setGearSheet(null)} />
      ) : null}
    </section>
  );
}

function LoadoutCard({ loadout, items, onEdit, onDefault, onDelete }: {
  loadout: Loadout;
  items: ArmoryItem[];
  onEdit(): void;
  onDefault(): void;
  onDelete(): void;
}) {
  let chips: string[] = [];
  let weaponLine = "Incomplete";
  try {
    const resolved = resolveLoadout(loadout, items);
    weaponLine = `${resolved.weapon.model} · ${resolved.weapon.type === "rifle" ? resolved.weapon.caliber : resolved.weapon.bowType}`;
    chips = [
      ...Object.values(resolved.attachments).map((attachment) => attachment.name),
      ...(resolved.ammunition ? [`${resolved.ammunition.brand ?? "Ammo"} · ${resolved.ammunition.grain}gr`] : []),
    ];
  } catch {
    // Missing referenced items: show the card without resolved facts.
  }
  return (
    <article className={`arm-lo-card${loadout.isDefault ? " arm-lo-card-default" : ""}`}>
      <div className="arm-lo-head">
        <span className="arm-lo-initial">{loadout.name.charAt(0).toUpperCase() || "L"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="arm-lo-name">{loadout.name}</div>
          <div className="arm-lo-weapon">{weaponLine}</div>
        </div>
        {loadout.isDefault ? <span className="arm-default-badge">DEFAULT</span> : null}
      </div>
      {chips.length > 0 ? <div className="arm-lo-chips">{chips.map((chip) => <span className="arm-lo-chip" key={chip}>{chip}</span>)}</div> : null}
      <div className="arm-lo-actions">
        <button type="button" className="arm-lo-edit" onClick={onEdit}>Edit</button>
        <button type="button" className="arm-lo-default" disabled={loadout.isDefault} onClick={onDefault}>{loadout.isDefault ? "Default ✓" : "Set default"}</button>
        <button type="button" className="arm-lo-delete" aria-label={`Delete ${loadout.name}`} onClick={onDelete}>✕</button>
      </div>
    </article>
  );
}
