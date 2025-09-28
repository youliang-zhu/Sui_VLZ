import React, { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FieldError } from "./ErrorMessage";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showToggle?: boolean;
  className?: string;
}

/**
 * Simple password input with visibility toggle
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, showToggle = true, className, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Lock className="w-4 h-4 mr-1" />
            {label}
          </label>
        )}

        {/* Input with toggle */}
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={value || ""}
            onChange={onChange}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              showToggle ? "pr-10" : "",
              error ? "border-red-500 focus:ring-red-500" : "",
              className
            )}
            {...props}
          />

          {/* Toggle button */}
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          )}
        </div>

        {/* Error message */}
        <FieldError error={error} />
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;