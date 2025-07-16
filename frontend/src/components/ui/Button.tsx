import { cn } from "@utils/helpers"; // Helper pour merger les classes tailwind (exemple ci-dessous)
import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, children, loading, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-500",
        variant === "primary" && "bg-cyan-500 text-white hover:bg-cyan-600",
        variant === "outline" && "border border-cyan-500 text-cyan-500 bg-transparent hover:bg-cyan-500 hover:text-white",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "bg-transparent text-zinc-200 hover:bg-zinc-800",
        (loading || disabled) && "opacity-60 pointer-events-none",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";
export default Button;
