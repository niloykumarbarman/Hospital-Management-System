import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--foreground-muted)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "focus-ring h-10 rounded-lg px-3 text-sm",
            "bg-[var(--glass-bg)] border border-[var(--border)]",
            "text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]",
            "transition-colors duration-200",
            error && "border-[var(--danger)]",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
