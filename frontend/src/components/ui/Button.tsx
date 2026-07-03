import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "focus-ring inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" && "btn-gradient text-white",
          variant === "secondary" &&
            "glass text-[var(--foreground)] hover:bg-[var(--glass-bg-hover)]",
          variant === "ghost" &&
            "bg-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5",
          variant === "danger" &&
            "bg-[var(--danger)] text-white hover:brightness-110 active:scale-[0.98] transition-transform duration-200",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
