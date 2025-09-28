import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Simple loading spinner component
 */
export function LoadingSpinner({ 
  size = "md", 
  className,
  children 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      {children && (
        <span className="ml-2 text-sm text-gray-600">{children}</span>
      )}
    </div>
  );
}

/**
 * Loading wrapper - show spinner when loading
 */
interface LoadingWrapperProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LoadingWrapper({ isLoading, children, className }: LoadingWrapperProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <LoadingSpinner>Loading...</LoadingSpinner>
      </div>
    );
  }
  return <>{children}</>;
}

/**
 * Button loading state
 */
export function ButtonLoading({ 
  isLoading, 
  children 
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <LoadingSpinner size="sm" />
        <span>Loading...</span>
      </div>
    );
  }
  return <>{children}</>;
}

export default LoadingSpinner;