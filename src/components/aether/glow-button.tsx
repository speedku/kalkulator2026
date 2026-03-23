"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GlowButtonVariant = "primary" | "secondary" | "danger";
type GlowButtonSize = "sm" | "md" | "lg";

interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlowButtonVariant;
  size?: GlowButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<GlowButtonVariant, string> = {
  primary:
    "bg-aether-blue text-white border-transparent hover:bg-aether-blue/90 hover:shadow-glow-md",
  secondary:
    "bg-transparent text-aether-text border border-aether-border hover:border-aether-border-glow hover:shadow-glow-sm",
  danger:
    "bg-aether-rose text-white border-transparent hover:bg-aether-rose/90",
};

const sizeClasses: Record<GlowButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

const GlowButtonInner = React.forwardRef<
  HTMLButtonElement,
  GlowButtonProps & { pending?: boolean }
>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      pending,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isLoading = loading || pending;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue focus-visible:ring-offset-1 focus-visible:ring-offset-aether-void",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
GlowButtonInner.displayName = "GlowButtonInner";

/**
 * GlowButton automatically uses useFormStatus for pending state when inside a form.
 * Use the `loading` prop to manually control loading state.
 */
function GlowButtonWithStatus(props: GlowButtonProps) {
  const { pending } = useFormStatus();
  return <GlowButtonInner {...props} pending={pending} />;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (props, ref) => {
    return <GlowButtonInner {...props} ref={ref} />;
  }
);
GlowButton.displayName = "GlowButton";

/**
 * SubmitButton — use inside forms to auto-detect pending state via useFormStatus.
 */
export function SubmitButton(props: GlowButtonProps) {
  return <GlowButtonWithStatus type="submit" {...props} />;
}
