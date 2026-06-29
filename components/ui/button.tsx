import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn("button", `button-${variant}`, className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
