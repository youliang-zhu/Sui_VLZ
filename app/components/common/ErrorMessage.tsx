import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  X
} from "lucide-react";

// Error types for different severity levels
type ErrorType = "error" | "warning" | "info" | "success";

// Error display variants
type ErrorVariant = "default" | "destructive" | "outline" | "ghost";

interface ErrorMessageProps {
  error: string | Error | null;
  type?: ErrorType;
  variant?: ErrorVariant;
  title?: string;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  children?: React.ReactNode;
}

// Icon mappings for different error types
const iconMap: Record<ErrorType, React.ComponentType<any>> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: AlertCircle,
};

// Color mappings for different error types
const colorClasses: Record<ErrorType, string> = {
  error: "text-red-600 bg-red-50 border-red-200",
  warning: "text-yellow-600 bg-yellow-50 border-yellow-200", 
  info: "text-blue-600 bg-blue-50 border-blue-200",
  success: "text-green-600 bg-green-50 border-green-200",
};

// Icon color mappings
const iconColorClasses: Record<ErrorType, string> = {
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500", 
  success: "text-green-500",
};

/**
 * Main ErrorMessage component
 */
export function ErrorMessage({
  error,
  type = "error",
  variant = "default",
  title,
  showIcon = true,
  dismissible = false,
  onDismiss,
  onRetry,
  retryText = "Try Again",
  className,
  children,
}: ErrorMessageProps) {
  // Don't render if no error
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;
  const Icon = iconMap[type];

  // Use Alert component for styled errors
  if (variant === "destructive") {
    return (
      <Alert variant="destructive" className={className}>
        {showIcon && <AlertCircle className="h-4 w-4" />}
        <AlertDescription>
          <div className="flex flex-col space-y-2">
            {title && <div className="font-medium">{title}</div>}
            <div>{errorMessage}</div>
            {children}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="self-start mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryText}
              </Button>
            )}
          </div>
        </AlertDescription>
        {dismissible && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Alert>
    );
  }

  // Custom styled error message
  return (
    <div
      className={cn(
        "relative rounded-lg border p-4",
        colorClasses[type],
        className
      )}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        {showIcon && (
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColorClasses[type])} />
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <p className="text-sm">{errorMessage}</p>
          {children && <div className="mt-2">{children}</div>}
        </div>

        <div className="flex items-center space-x-2">
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className={cn(
                "h-8 px-2 text-xs",
                type === "error" ? "hover:bg-red-100" : 
                type === "warning" ? "hover:bg-yellow-100" :
                type === "info" ? "hover:bg-blue-100" : "hover:bg-green-100"
              )}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {retryText}
            </Button>
          )}
          
          {dismissible && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className={cn(
                "h-6 w-6 p-0",
                type === "error" ? "hover:bg-red-100" :
                type === "warning" ? "hover:bg-yellow-100" :
                type === "info" ? "hover:bg-blue-100" : "hover:bg-green-100"
              )}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message for forms
 */
interface InlineErrorProps {
  error?: string | null;
  className?: string;
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null;

  return (
    <p className={cn("text-sm text-red-600 mt-1", className)}>
      {error}
    </p>
  );
}

/**
 * Field error message with icon
 */
export function FieldError({ error, className }: InlineErrorProps) {
  if (!error) return null;

  return (
    <div className={cn("flex items-center space-x-1 mt-1", className)}>
      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
      <p className="text-xs text-red-600">{error}</p>
    </div>
  );
}

/**
 * Error boundary fallback component
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  className?: string;
}

export function ErrorFallback({ error, resetError, className }: ErrorFallbackProps) {
  return (
    <div className={cn("rounded-lg border border-red-200 bg-red-50 p-6", className)}>
      <div className="flex flex-col items-center text-center space-y-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <div>
          <h2 className="text-lg font-semibold text-red-900">
            Something went wrong
          </h2>
          <p className="text-sm text-red-700 mt-1">
            {error.message || "An unexpected error occurred"}
          </p>
        </div>
        <Button onClick={resetError} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-red-600 mt-4">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap text-left">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Network error component
 */
interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorMessage
      error="Network connection failed. Please check your internet connection and try again."
      type="error"
      title="Connection Error"
      onRetry={onRetry}
      retryText="Retry Connection"
      className={className}
    />
  );
}

/**
 * Wallet connection error component
 */
export function WalletError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorMessage
      error="Failed to connect to wallet. Please make sure your wallet is installed and unlocked."
      type="warning"
      title="Wallet Connection Failed"
      onRetry={onRetry}
      retryText="Retry Connection"
      className={className}
    />
  );
}

/**
 * Transaction error component
 */
interface TransactionErrorProps {
  digest?: string;
  onRetry?: () => void;
  className?: string;
}

export function TransactionError({ digest, onRetry, className }: TransactionErrorProps) {
  return (
    <ErrorMessage
      error={
        digest 
          ? `Transaction failed. Transaction ID: ${digest.slice(0, 8)}...`
          : "Transaction failed. Please try again."
      }
      type="error"
      title="Transaction Failed"
      onRetry={onRetry}
      retryText="Retry Transaction"
      className={className}
    >
      {digest && (
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => {
              navigator.clipboard.writeText(digest);
            }}
          >
            Copy Transaction ID
          </Button>
        </div>
      )}
    </ErrorMessage>
  );
}

/**
 * Validation error list component
 */
interface ValidationErrorsProps {
  errors: Record<string, string>;
  className?: string;
}

export function ValidationErrors({ errors, className }: ValidationErrorsProps) {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {errorEntries.map(([field, message]) => (
        <FieldError key={field} error={message} />
      ))}
    </div>
  );
}

/**
 * Loading error component
 */
interface LoadingErrorProps {
  resource?: string;
  onRetry?: () => void;
  className?: string;
}

export function LoadingError({ 
  resource = "data", 
  onRetry, 
  className 
}: LoadingErrorProps) {
  return (
    <ErrorMessage
      error={`Failed to load ${resource}. Please try again.`}
      type="error"
      title="Loading Failed"
      onRetry={onRetry}
      retryText="Reload"
      className={className}
    />
  );
}

/**
 * Success message component
 */
interface SuccessMessageProps {
  message: string;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function SuccessMessage({
  message,
  title,
  dismissible = false,
  onDismiss,
  className,
  children,
}: SuccessMessageProps) {
  return (
    <ErrorMessage
      error={message}
      type="success"
      title={title}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    >
      {children}
    </ErrorMessage>
  );
}

// Export default error message
export default ErrorMessage;