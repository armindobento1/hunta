import type { CSSProperties } from "react";
import { cn } from "@/lib/ui/cn";
// Canonical Hunta mark. Do NOT redraw, crop, trace, optimize, or replace this file.
import mark from "@/src/assets/brand/hunta-mark.png";

export interface BrandLogoProps {
  /** Square size in px, or any CSS length (e.g. "clamp(150px,18vw,224px)"). */
  size?: number | string;
  className?: string;
  /** Accessible label. Pass "" to render decorative (aria-hidden). */
  label?: string;
  /** Explicit color. Defaults to currentColor (inherits from text color). */
  color?: string;
}

/**
 * The Hunta brand mark, rendered as a CSS mask over the canonical
 * monochrome transparent PNG so it inherits `currentColor` (or an
 * explicit `color` prop). All logo usage in the app must go through
 * this component — never embed the artwork directly.
 */
export function BrandLogo({ size = 24, className, label = "Hunta", color }: BrandLogoProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color ?? "currentColor",
    WebkitMaskImage: `url(${mark})`,
    maskImage: `url(${mark})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true } as const);
  return <span {...a11y} className={cn("inline-block align-middle", className)} style={style} />;
}
