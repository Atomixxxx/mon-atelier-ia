import * as React from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, iconLeft, iconRight, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div
          className={clsx(
            "flex items-center px-3 py-2 rounded-lg bg-zinc-800 border transition-colors",
            error ? "border-red-500 focus-within:border-red-500" : "border-zinc-700 focus-within:border-cyan-500",
            className
          )}
        >
          {iconLeft && <span className="mr-2 text-zinc-400">{iconLeft}</span>}
          <input
            ref={ref}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-zinc-400"
            {...props}
          />
          {iconRight && <span className="ml-2 text-zinc-400">{iconRight}</span>}
        </div>
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
