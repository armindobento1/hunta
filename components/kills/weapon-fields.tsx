import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

import type { EditorFields } from "./kill-form";

export function WeaponFields({
  register,
  errors,
  weaponType,
}: {
  register: UseFormRegister<EditorFields>;
  errors: FieldErrors<EditorFields>;
  weaponType: "rifle" | "bow";
}) {
  return (
    <section className="editor-section" aria-labelledby="weapon-heading">
      <div className="section-heading">
        <div>
          <p>04</p>
          <h2 id="weapon-heading">Equipment</h2>
        </div>
        <span>Exact details</span>
      </div>
      <div className="editor-grid two-columns">
        <FormField label="Weapon type" htmlFor="weapon-type">
          <select id="weapon-type" className="text-input" {...register("weaponType")}>
            <option value="rifle">Rifle</option>
            <option value="bow">Bow</option>
          </select>
        </FormField>
        <FormField
          label="Weapon model"
          htmlFor="weapon-model"
          error={errors.weaponModel?.message}
        >
          <Input
            id="weapon-model"
            {...register("weaponModel", { required: "Weapon model is required." })}
          />
        </FormField>
      </div>
      <div className="editor-grid two-columns">
        {weaponType === "rifle" ? (
          <FormField
            label="Caliber"
            htmlFor="caliber"
            error={errors.caliber?.message}
          >
            <Input
              id="caliber"
              placeholder=".300 Win Mag"
              {...register("caliber", {
                validate: (value) => value.trim().length > 0 || "Caliber is required.",
              })}
            />
          </FormField>
        ) : (
          <FormField
            label="Bow type"
            htmlFor="bow-type"
            error={errors.bowType?.message}
          >
            <Input
              id="bow-type"
              placeholder="Compound"
              {...register("bowType", {
                validate: (value) => value.trim().length > 0 || "Bow type is required.",
              })}
            />
          </FormField>
        )}
        <FormField
          label="Grain"
          htmlFor="grain"
          error={errors.grain?.message}
        >
          <Input
            id="grain"
            type="number"
            step="any"
            {...register("grain", {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isFinite(value) && value > 0) || "Enter a positive grain weight.",
            })}
          />
        </FormField>
      </div>
      <div className="editor-grid two-columns">
        <FormField label="Ammunition brand" htmlFor="ammunition-brand">
          <Input id="ammunition-brand" {...register("ammunitionBrand")} />
        </FormField>
        <FormField label="Brand / color detail" htmlFor="ammunition-detail">
          <Input id="ammunition-detail" {...register("ammunitionDetail")} />
        </FormField>
      </div>
    </section>
  );
}
