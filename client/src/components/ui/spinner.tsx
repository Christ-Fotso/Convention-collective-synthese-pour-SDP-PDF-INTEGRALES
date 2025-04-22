import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "small" | "medium" | "large";
  variant?: "default" | "legal";
}

export function Spinner({ className, size = "medium", variant = "default" }: SpinnerProps) {
  const sizeStyles = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };
  
  const variantStyles = {
    default: "text-primary",
    legal: "text-black dark:text-white",
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={cn(
          "animate-spin rounded-full border-t-2 border-b-2 border-current",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
      />
      {variant === "legal" && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">Justice en cours...</p>
          <p className="mt-1">Extraction des dispositions légales</p>
        </div>
      )}
    </div>
  );
}