import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "tertiary";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  tertiary: "bg-tertiary text-white",
  ghost: "bg-surface-lowest text-on-surface",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

export interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  filledIcon?: boolean;
  children?: ReactNode;
}

/**
 * Tombol utama RPLBox: pill, border 2px, hard shadow, turun saat ditekan.
 */
export function PillButton({
  variant = "primary",
  size = "md",
  icon,
  filledIcon = false,
  children,
  className = "",
  type = "button",
  ...rest
}: PillButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full border-2 border-on-surface font-bold tracking-tight",
        "hard-shadow transition-all duration-100",
        "hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none",
        "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none disabled:translate-y-0",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {icon ? (
        <span
          className={`material-symbols-outlined ${filledIcon ? "is-filled" : ""}`}
          style={{ fontSize: size === "lg" ? "1.5rem" : "1.25rem" }}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export default PillButton;
