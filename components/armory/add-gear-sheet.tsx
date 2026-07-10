import { useState, type FormEvent } from "react";

import { armoryItemSchema, type ArmoryItem } from "@/lib/domain/armory";
import { saveArmoryItem } from "@/lib/firebase/armory-repository";

const KINDS: ArmoryItem["kind"][] = ["weapon", "optic", "suppressor", "bipod", "sling", "ammunition", "arrow", "broadhead"];
const newId = () => globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}`;

export function AddGearSheet({ uid, initialKind, lockKind = false, onClose, onSaved }: {
  uid: string;
  initialKind?: ArmoryItem["kind"];
  lockKind?: boolean;
  onClose(): void;
  onSaved(item: ArmoryItem): void;
}) {
  const [kind, setKind] = useState<ArmoryItem["kind"]>(initialKind ?? "weapon");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [weaponType, setWeaponType] = useState<"rifle" | "bow">("rifle");
  const [spec, setSpec] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsGrain = kind === "ammunition" || kind === "broadhead";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const common = { id: newId(), ownerId: uid, name: name.trim(), createdAt: now, updatedAt: now };
      const detailPart = detail.trim() ? { detail: detail.trim() } : {};
      const item = armoryItemSchema.parse(
        kind === "weapon"
          ? { ...common, kind, weapon: weaponType === "rifle" ? { type: "rifle", model: name.trim(), caliber: spec.trim() } : { type: "bow", model: name.trim(), bowType: spec.trim() } }
          : needsGrain
            ? { ...common, kind, grain: Number(spec), ...detailPart }
            : { ...common, kind, ...detailPart },
      );
      await saveArmoryItem(item);
      onSaved(item);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save equipment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="sheet-scrim" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Add gear">
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <span className="sheet-title">Add gear</span>
          <span className="sheet-count">{kind}</span>
        </div>
        <form onSubmit={submit}>
          {!lockKind ? (
            <>
              <div className="sheet-label">TYPE</div>
              <select className="sheet-input" value={kind} onChange={(event) => setKind(event.target.value as ArmoryItem["kind"])}>
                {KINDS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </>
          ) : null}
          {kind === "weapon" ? (
            <>
              <div className="sheet-label">WEAPON TYPE</div>
              <select className="sheet-input" value={weaponType} onChange={(event) => setWeaponType(event.target.value as "rifle" | "bow")}>
                <option value="rifle">Rifle</option>
                <option value="bow">Bow</option>
              </select>
            </>
          ) : null}
          <div className="sheet-label">NAME / MODEL</div>
          <input className="sheet-input" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
          {kind === "weapon" || needsGrain ? (
            <>
              <div className="sheet-label">{kind === "weapon" ? (weaponType === "rifle" ? "CALIBER" : "BOW TYPE") : "GRAIN"}</div>
              <input
                className="sheet-input"
                required
                type={needsGrain ? "number" : "text"}
                min={needsGrain ? 1 : undefined}
                max={needsGrain ? 2000 : undefined}
                value={spec}
                onChange={(event) => setSpec(event.target.value)}
              />
            </>
          ) : null}
          {kind !== "weapon" ? (
            <>
              <div className="sheet-label">DETAIL</div>
              <input className="sheet-input" maxLength={160} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="e.g. 2-16×50 · ballistic turret" />
            </>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" className="sheet-primary" disabled={busy}>{busy ? "Saving…" : "Save to armory"}</button>
          <button type="button" className="sheet-cancel" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </>
  );
}
