"use client";

import { m as motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: React.ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-bth-green-800 hover:bg-bth-green-700 text-white transition-colors duration-100",
  secondary:
    "bg-white hover:bg-bth-n-50 text-bth-n-900 border border-bth-hairline-strong transition-colors duration-100",
  ghost:
    "bg-transparent hover:bg-bth-n-100 text-bth-n-600 transition-colors duration-100",
  danger:
    "bg-bth-error hover:bg-[#a83c2e] text-white transition-colors duration-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[12px]",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-[15px]",
};

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-bth-pill bth-focus",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </motion.button>
  );
}
