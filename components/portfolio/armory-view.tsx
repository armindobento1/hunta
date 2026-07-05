import { Crosshair, Plus, Shield, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { resolveLoadout, type ArmoryItem, type Loadout } from "@/lib/domain/armory";
import { deleteArmoryItem, deleteLoadout, saveArmoryItem, saveLoadout, setDefaultLoadout } from "@/lib/firebase/armory-repository";
import { useArmory } from "@/lib/hooks/use-armory";
import { useAuth } from "@/lib/hooks/use-auth";

const id = (prefix: string) => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}`;
const SLOT_KINDS = ["optic", "suppressor", "bipod", "sling", "ammunition"] as const;

export function ArmoryView() {
  const { user } = useAuth();
  const { items, loadouts, loading, error } = useArmory();
  const [itemForm, setItemForm] = useState(false);
  const [loadoutForm, setLoadoutForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) return <section className="armory-view"><p>Loading your armory…</p></section>;

  return (
    <section className="armory-view" aria-labelledby="armory-heading">
      <div className="section-title-row">
        <div><p className="mono-label">PRIVATE EQUIPMENT LIBRARY</p><h2 id="armory-heading">Your armory</h2></div>
        <span className="gear-count">{items.length} items</span>
      </div>
      <div className="armory-actions">
        <button type="button" onClick={() => setItemForm((value) => !value)}><Plus /> Add equipment</button>
        <button type="button" disabled={!items.some((item) => item.kind === "weapon")} onClick={() => setLoadoutForm((value) => !value)}><Crosshair /> New loadout</button>
      </div>
      {itemForm && user ? <ItemForm uid={user.uid} onDone={() => setItemForm(false)} /> : null}
      {loadoutForm && user ? <LoadoutForm uid={user.uid} items={items} onDone={() => setLoadoutForm(false)} /> : null}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}

      {items.length === 0 ? (
        <div className="armory-empty"><span className="armory-empty-icon"><Shield /></span><h3>No equipment saved yet</h3><p>Add a weapon first, then add attachments and build reusable loadouts.</p></div>
      ) : (
        <div className="gear-grid">
          {items.map((item) => <article className="gear-card" key={item.id}>
            <span className="gear-card-img"><Crosshair /></span>
            <span className="gear-card-body"><strong className="gear-card-name">{item.name}</strong><span className="gear-card-spec">{item.kind}{item.kind === "weapon" ? ` · ${item.weapon.type === "rifle" ? item.weapon.caliber : item.weapon.bowType}` : item.detail ? ` · ${item.detail}` : ""}</span></span>
            <button className="gear-delete" aria-label={`Delete ${item.name}`} onClick={async () => { if (!user || !confirm(`Delete ${item.name}?`)) return; try { await deleteArmoryItem(user.uid, item.id); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not delete equipment."); } }}><Trash2 /></button>
          </article>)}
        </div>
      )}

      <div className="loadouts-section"><p className="mono-label">LOADOUTS</p>
        {loadouts.length === 0 ? <div className="loadout-empty"><span>No loadouts yet.</span><strong>Select a weapon, then fill attachment slots.</strong></div> :
          <div className="loadouts-list">{loadouts.map((loadout) => <LoadoutCard key={loadout.id} loadout={loadout} items={items} onDefault={() => user && setDefaultLoadout(user.uid, loadout.id)} onDelete={() => user && confirm(`Delete ${loadout.name}?`) && deleteLoadout(user.uid, loadout.id)} />)}</div>}
      </div>
    </section>
  );
}

function ItemForm({ uid, onDone }: { uid: string; onDone(): void }) {
  const [kind, setKind] = useState<ArmoryItem["kind"]>("weapon");
  const [name, setName] = useState(""); const [detail, setDetail] = useState("");
  const [weaponType, setWeaponType] = useState<"rifle" | "bow">("rifle"); const [spec, setSpec] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); const now = new Date().toISOString(); const common = { id: id("item"), ownerId: uid, name: name.trim(), createdAt: now, updatedAt: now };
    const item: ArmoryItem = kind === "weapon" ? { ...common, kind, weapon: weaponType === "rifle" ? { type: "rifle", model: name.trim(), caliber: spec.trim() } : { type: "bow", model: name.trim(), bowType: spec.trim() } } : kind === "ammunition" ? { ...common, kind, grain: Number(spec), ...(detail.trim() ? { detail: detail.trim() } : {}) } : { ...common, kind, ...(detail.trim() ? { detail: detail.trim() } : {}) };
    await saveArmoryItem(item); onDone();
  }
  return <form className="armory-form" onSubmit={submit}>
    <label>Equipment type<select value={kind} onChange={(event) => setKind(event.target.value as ArmoryItem["kind"])}>{["weapon", ...SLOT_KINDS].map((value) => <option key={value}>{value}</option>)}</select></label>
    {kind === "weapon" ? <label>Weapon type<select value={weaponType} onChange={(event) => setWeaponType(event.target.value as "rifle" | "bow")}><option value="rifle">Rifle</option><option value="bow">Bow</option></select></label> : null}
    <label>Name / model<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
    {(kind === "weapon" || kind === "ammunition") ? <label>{kind === "weapon" ? (weaponType === "rifle" ? "Caliber" : "Bow type") : "Grain"}<input required type={kind === "ammunition" ? "number" : "text"} value={spec} onChange={(event) => setSpec(event.target.value)} /></label> : null}
    {kind !== "weapon" ? <label>Detail<input value={detail} onChange={(event) => setDetail(event.target.value)} /></label> : null}
    <button type="submit">Save equipment</button>
  </form>;
}

function LoadoutForm({ uid, items, onDone }: { uid: string; items: ArmoryItem[]; onDone(): void }) {
  const [name, setName] = useState(""); const [weaponId, setWeaponId] = useState(items.find((item) => item.kind === "weapon")?.id ?? "");
  const [slots, setSlots] = useState<Loadout["slots"]>({});
  async function submit(event: FormEvent) { event.preventDefault(); const now = new Date().toISOString(); await saveLoadout({ id: id("loadout"), ownerId: uid, name: name.trim(), weaponId, slots, isDefault: false, createdAt: now, updatedAt: now }); onDone(); }
  return <form className="loadout-builder" onSubmit={submit}><p className="mono-label">WEAPON-FIRST SLOT BUILDER</p><label>Loadout name<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Weapon<select required value={weaponId} onChange={(event) => setWeaponId(event.target.value)}>{items.filter((item) => item.kind === "weapon").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="loadout-slot-grid">{SLOT_KINDS.map((kind) => <label key={kind}>{kind}<select value={slots[`${kind}Id`] ?? ""} onChange={(event) => setSlots((current) => ({ ...current, [`${kind}Id`]: event.target.value || undefined }))}><option value="">+ Select</option>{items.filter((item) => item.kind === kind).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>)}</div><button type="submit">Save loadout</button></form>;
}

function LoadoutCard({ loadout, items, onDefault, onDelete }: { loadout: Loadout; items: ArmoryItem[]; onDefault(): void; onDelete(): void }) {
  let resolved; try { resolved = resolveLoadout(loadout, items); } catch { return <article className="loadout-card"><div className="loadout-head"><strong>{loadout.name}</strong><span>Incomplete</span></div></article>; }
  return <article className="loadout-card"><div className="loadout-head"><div><strong className="loadout-name">{loadout.name}</strong><span className="loadout-use">{resolved.weapon.model}</span></div>{loadout.isDefault ? <span className="default-badge">DEFAULT</span> : null}</div><div className="loadout-rows">{Object.entries(resolved.attachments).map(([kind, value]) => <div className="loadout-row" key={kind}><span>{kind}</span><strong>{value.name}</strong></div>)}{resolved.ammunition ? <div className="loadout-row"><span>ammo</span><strong>{resolved.ammunition.brand} · {resolved.ammunition.grain}gr</strong></div> : null}</div><div className="loadout-actions"><button onClick={onDefault}>{loadout.isDefault ? "Default" : "Set default"}</button><button onClick={onDelete}>Delete</button></div></article>;
}
