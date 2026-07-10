import { useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { AddGearSheet } from "@/components/armory/add-gear-sheet";
import { armoryItemSpec } from "@/components/armory/item-spec";
import { BowSilhouette, RifleSilhouette } from "@/components/armory/weapon-silhouettes";
import { getLoadoutSchematic, type ArmoryItem, type Loadout, type LoadoutSlotKey, type SchematicSlot } from "@/lib/domain/armory";
import type { Weapon } from "@/lib/domain/kill";
import { saveLoadout, setDefaultLoadout } from "@/lib/firebase/armory-repository";

type WeaponItem = Extract<ArmoryItem, { kind: "weapon" }>;
type ChipDir = "left" | "right" | "up" | "down";
const newId = () => globalThis.crypto?.randomUUID?.() ?? `loadout-${Date.now()}`;

// Which side the filled-slot label chip sits on, per weapon type and slot.
const CHIP_DIR: Record<Weapon["type"], Partial<Record<LoadoutSlotKey, ChipDir>>> = {
  rifle: { opticId: "left", suppressorId: "up", ammunitionId: "down", bipodId: "left", slingId: "right" },
  bow: { opticId: "left", arrowId: "down", broadheadId: "up", slingId: "right" },
};

const kindTitle = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

export function LoadoutBuilder({ uid, items, loadouts, existing }: {
  uid: string;
  items: ArmoryItem[];
  loadouts: Loadout[];
  existing?: Loadout;
}) {
  const navigate = useNavigate();
  const weapons = items.filter((item): item is WeaponItem => item.kind === "weapon");
  const [weaponId, setWeaponId] = useState(existing?.weaponId ?? weapons[0]?.id ?? "");
  const [slots, setSlots] = useState<Loadout["slots"]>(existing?.slots ?? {});
  const [pickerSlot, setPickerSlot] = useState<SchematicSlot | null>(null);
  const [pendingSlot, setPendingSlot] = useState<SchematicSlot | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? loadouts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const weapon = weapons.find((item) => item.id === weaponId);
  const schematic = weapon ? getLoadoutSchematic(weapon.weapon.type) : [];
  const filledCount = schematic.filter((entry) => slots[entry.slot]).length;
  const itemById = (id?: string) => (id ? items.find((item) => item.id === id) : undefined);
  const backToArmory = () => navigate("/portfolio", { state: { tab: "armory" } });

  function switchWeapon(next: WeaponItem) {
    if (next.id === weaponId) return;
    if (weapon && next.weapon.type !== weapon.weapon.type && filledCount > 0) {
      const proceed = confirm(`Switch to ${next.name}? A ${next.weapon.type} uses different slots. Your ${weapon.weapon.type} attachments will be cleared from this loadout.`);
      if (!proceed) return;
      setSlots({});
    }
    setWeaponId(next.id);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!weapon || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const loadout: Loadout = {
        id: existing?.id ?? newId(), ownerId: uid, name: name.trim(), weaponId: weapon.id, slots,
        isDefault: existing?.isDefault ?? false, createdAt: existing?.createdAt ?? now, updatedAt: now,
      };
      await saveLoadout(loadout);
      if (isDefault) await setDefaultLoadout(uid, loadout.id);
      backToArmory();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the loadout.");
      setBusy(false);
    }
  }

  if (weapons.length === 0) {
    return (
      <main className="bld-shell">
        <div className="bld-top">
          <button type="button" className="bld-back" aria-label="Back to armory" onClick={backToArmory} />
          <div style={{ flex: 1 }}>
            <div className="bld-eyebrow">NEW LOADOUT</div>
            <div className="bld-title">No weapons yet</div>
          </div>
        </div>
        <p className="sheet-sub" style={{ marginTop: 16 }}>Add a rifle or bow to your armory first — a loadout is built on a weapon.</p>
      </main>
    );
  }

  return (
    <main className="bld-shell">
      <div className="bld-top">
        <button type="button" className="bld-back" aria-label="Back to armory" onClick={backToArmory} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bld-eyebrow">{existing ? "EDIT LOADOUT" : "NEW LOADOUT"}</div>
          <div className="bld-title">{weapon?.name ?? "Pick a weapon"}</div>
        </div>
        <button type="button" className="bld-clear" onClick={() => setSlots({})}>Clear</button>
      </div>

      <div className="bld-wchips">
        {weapons.map((entry) => (
          <button key={entry.id} type="button" className={`bld-wchip${entry.id === weaponId ? " bld-wchip-active" : ""}`} onClick={() => switchWeapon(entry)}>
            {entry.name} <span className="bld-wchip-spec">{entry.weapon.type === "rifle" ? entry.weapon.caliber : entry.weapon.bowType}</span>
          </button>
        ))}
      </div>

      <div className="bld-sec-row">
        <span className="bld-sec-label">LOADOUT SCHEMATIC</span>
        <span className="bld-sec-count">{filledCount} / {schematic.length} SLOTS</span>
      </div>
      <div className="bld-panel">
        <div className="bld-stage">
          <span className="bld-silhouette" aria-hidden="true">
            {weapon?.weapon.type === "bow" ? <BowSilhouette /> : <RifleSilhouette />}
          </span>
          {weapon ? schematic.map((entry) => {
            const item = itemById(slots[entry.slot]);
            if (item) {
              return <FilledSlot key={entry.slot} entry={entry} item={item} weaponType={weapon.weapon.type} onClick={() => setPickerSlot(entry)} />;
            }
            return (
              <span key={entry.slot} className="bld-anchor" style={{ left: `${entry.anchor.x}%`, top: `${entry.anchor.y}%` }}>
                <button type="button" className="bld-slot-btn" aria-label={`Add ${entry.label}`} onClick={() => setPickerSlot(entry)}>
                  <span className="bld-slot-ring"><span className="arm-plus" style={{ width: 13, height: 13 }} aria-hidden="true" /></span>
                  <span className="bld-slot-label">{entry.label}</span>
                </button>
              </span>
            );
          }) : null}
        </div>
        <div className="bld-fig-row">
          <span>{weapon ? `${weapon.name} — side profile` : ""}</span>
          <span>{weapon?.weapon.type === "bow" ? "FIG. 02" : "FIG. 01"}</span>
        </div>
      </div>

      <div className="bld-rows">
        {schematic.map((entry) => {
          const item = itemById(slots[entry.slot]);
          return (
            <button key={entry.slot} type="button" className="bld-row" onClick={() => setPickerSlot(entry)}>
              <span className="bld-row-kind">{entry.label}</span>
              {item ? <span className="bld-row-name">{item.name}</span> : <span className="bld-row-empty">Tap to add</span>}
              {item ? (armoryItemSpec(item) ? <span className="bld-row-spec">{armoryItemSpec(item)}</span> : null)
                : <span className="bld-row-plus"><span className="arm-plus" aria-hidden="true" /></span>}
            </button>
          );
        })}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" className="bld-save" disabled={!weapon} onClick={() => setSaveOpen(true)}>Save loadout</button>

      {pickerSlot && weapon ? (
        <PickerSheet
          slot={pickerSlot}
          items={items}
          selectedId={slots[pickerSlot.slot]}
          onPick={(id) => { setSlots((current) => ({ ...current, [pickerSlot.slot]: id })); setPickerSlot(null); }}
          onClearSlot={() => { setSlots((current) => ({ ...current, [pickerSlot.slot]: undefined })); setPickerSlot(null); }}
          onAddNew={() => { setPendingSlot(pickerSlot); setPickerSlot(null); }}
          onClose={() => setPickerSlot(null)}
        />
      ) : null}
      {pendingSlot ? (
        <AddGearSheet
          uid={uid}
          initialKind={pendingSlot.kind}
          lockKind
          onClose={() => setPendingSlot(null)}
          onSaved={(item) => {
            setSlots((current) => ({ ...current, [pendingSlot.slot]: item.id }));
            setPendingSlot(null);
          }}
        />
      ) : null}
      {saveOpen && weapon ? (
        <SaveSheet
          weapon={weapon}
          schematic={schematic}
          slots={slots}
          itemById={itemById}
          name={name}
          onName={setName}
          isDefault={isDefault}
          onToggleDefault={() => setIsDefault((value) => !value)}
          busy={busy}
          onSave={save}
          onClose={() => setSaveOpen(false)}
        />
      ) : null}
    </main>
  );
}

function FilledSlot({ entry, item, weaponType, onClick }: {
  entry: SchematicSlot;
  item: ArmoryItem;
  weaponType: Weapon["type"];
  onClick(): void;
}) {
  const dir: ChipDir = CHIP_DIR[weaponType][entry.slot] ?? "down";
  const { x, y } = entry.anchor;
  const spec = armoryItemSpec(item);
  const lead: CSSProperties =
    dir === "left" ? { left: `${x - 10}%`, top: `${y}%`, width: "10%", height: 1.5, transform: "translateY(-50%)" }
    : dir === "right" ? { left: `${x}%`, top: `${y}%`, width: "10%", height: 1.5, transform: "translateY(-50%)" }
    : dir === "up" ? { left: `${x}%`, top: `${y - 22}%`, width: 1.5, height: "22%", transform: "translateX(-50%)" }
    : { left: `${x}%`, top: `${y}%`, width: 1.5, height: "15%", transform: "translateX(-50%)" };
  const chip: CSSProperties =
    dir === "left" ? { left: `${x - 11}%`, top: `${y}%`, transform: "translate(-100%, -50%)", textAlign: "right" }
    : dir === "right" ? { left: `${x + 11}%`, top: `${y}%`, transform: "translateY(-50%)" }
    : dir === "up" ? (x > 80
      ? { right: 2, top: `${y - 23}%`, transform: "translateY(-100%)", textAlign: "right" }
      : { left: `${x}%`, top: `${y - 23}%`, transform: "translate(-50%, -100%)", textAlign: "center" })
    : { left: `${x}%`, top: `${y + 16}%`, transform: "translateX(-50%)", textAlign: "center" };
  return (
    <>
      <span className="bld-dot" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
      <span className="bld-lead" style={lead} aria-hidden="true" />
      <button type="button" className="bld-chip" style={chip} onClick={onClick} aria-label={`Change ${entry.label}: ${item.name}`}>
        <span className="bld-chip-name">{item.name}</span>
        <span className="bld-chip-kind">{entry.label}{spec ? ` · ${spec}` : ""}</span>
      </button>
    </>
  );
}

function PickerSheet({ slot, items, selectedId, onPick, onClearSlot, onAddNew, onClose }: {
  slot: SchematicSlot;
  items: ArmoryItem[];
  selectedId?: string;
  onPick(id: string): void;
  onClearSlot(): void;
  onAddNew(): void;
  onClose(): void;
}) {
  const kindItems = items.filter((item) => item.kind === slot.kind);
  return (
    <>
      <button type="button" className="sheet-scrim" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={`Pick ${slot.label}`}>
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <span className="sheet-title">{kindTitle(slot.kind)}</span>
          <span className={`sheet-count${kindItems.length === 0 ? " sheet-count-zero" : ""}`}>{kindItems.length} IN ARMORY</span>
        </div>
        {kindItems.length > 0 ? (
          <>
            <div className="sheet-sub">Only {slot.kind}s from your armory can fill this slot.</div>
            <div className="sheet-items">
              {kindItems.map((item) => (
                <button key={item.id} type="button" className={`sheet-item${item.id === selectedId ? " sheet-item-selected" : ""}`} onClick={() => onPick(item.id)}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="sheet-item-name">{item.name}</span>
                    {armoryItemSpec(item) ? <span className="sheet-item-spec">{armoryItemSpec(item)}</span> : null}
                  </span>
                  <span className={`sheet-radio${item.id === selectedId ? " sheet-radio-on" : ""}`} aria-hidden="true" />
                </button>
              ))}
              <button type="button" className="sheet-add-cta" onClick={onAddNew}>
                <span className="arm-plus" aria-hidden="true" />Add new {slot.kind} to armory
              </button>
            </div>
            {selectedId ? <button type="button" className="sheet-cancel" onClick={onClearSlot}>Clear slot</button> : null}
          </>
        ) : (
          <div className="sheet-empty">
            <strong>No {slot.kind}s yet</strong>
            <p>Add one to your armory first — then it can fill this slot in any matching loadout.</p>
            <button type="button" className="sheet-primary" style={{ width: "auto", padding: "0 22px" }} onClick={onAddNew}>Add {slot.kind}</button>
          </div>
        )}
        <button type="button" className="sheet-cancel" onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}

function SaveSheet({ weapon, schematic, slots, itemById, name, onName, isDefault, onToggleDefault, busy, onSave, onClose }: {
  weapon: WeaponItem;
  schematic: readonly SchematicSlot[];
  slots: Loadout["slots"];
  itemById(id?: string): ArmoryItem | undefined;
  name: string;
  onName(value: string): void;
  isDefault: boolean;
  onToggleDefault(): void;
  busy: boolean;
  onSave(event: FormEvent): void;
  onClose(): void;
}) {
  const filled = schematic.filter((entry) => slots[entry.slot]);
  const empty = schematic.filter((entry) => !slots[entry.slot]).map((entry) => entry.label.toLowerCase());
  return (
    <>
      <button type="button" className="sheet-scrim" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Save loadout">
        <div className="sheet-handle" />
        <div className="sheet-title-row"><span className="sheet-title">Save loadout</span></div>
        <form onSubmit={onSave}>
          <div className="sheet-label">NAME</div>
          <input className="sheet-input" required maxLength={120} value={name} placeholder="e.g. Highveld Kudu Setup" onChange={(event) => onName(event.target.value)} />
          <div className="sheet-label">SUMMARY</div>
          <div className="sheet-summary">
            <div className="sheet-sumrow">
              <span className="bld-row-kind">WEAPON</span>
              <span className="bld-row-name">{weapon.name}</span>
              <span className="bld-row-spec">{weapon.weapon.type === "rifle" ? weapon.weapon.caliber : weapon.weapon.bowType}</span>
            </div>
            {filled.map((entry) => {
              const item = itemById(slots[entry.slot]);
              if (!item) return null;
              return (
                <div className="sheet-sumrow" key={entry.slot}>
                  <span className="bld-row-kind">{entry.label}</span>
                  <span className="bld-row-name">{item.name}</span>
                  {armoryItemSpec(item) ? <span className="bld-row-spec">{armoryItemSpec(item)}</span> : null}
                </div>
              );
            })}
          </div>
          {empty.length > 0 ? <div className="sheet-note">{empty.join(" and ")} left empty — you can add them later.</div> : null}
          <div className="sheet-toggle-row">
            <span>Set as default loadout</span>
            <button type="button" className="sheet-switch" role="switch" aria-checked={isDefault} aria-label="Set as default loadout" onClick={onToggleDefault} />
          </div>
          <button type="submit" className="sheet-primary" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save loadout"}</button>
          <button type="button" className="sheet-cancel" onClick={onClose}>Back</button>
        </form>
      </div>
    </>
  );
}
