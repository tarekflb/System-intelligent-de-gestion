"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/button";
import { HTMLAttributes, ReactNode, useState } from "react";

const alertBoxVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        success:
          "border-green-500/50 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-900/20 dark:text-green-400 [&>svg]:text-green-500",
        warning:
          "border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-400 [&>svg]:text-amber-500",
        error:
          "border-red-500/50 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400 [&>svg]:text-red-500",
        info: "border-blue-500/50 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-400 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertBoxProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertBoxVariants> {
  title?: string;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AlertBox({
  className,
  variant,
  title,
  icon,
  dismissible = false,
  onDismiss,
  children,
  ...props
}: AlertBoxProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  // Sélectionner l'icône par défaut en fonction de la variante
  let defaultIcon = null;
  switch (variant) {
    case "success":
      defaultIcon = <CheckCircle className="h-4 w-4" />;
      break;
    case "warning":
      defaultIcon = <AlertTriangle className="h-4 w-4" />;
      break;
    case "error":
      defaultIcon = <AlertCircle className="h-4 w-4" />;
      break;
    case "info":
      defaultIcon = <Info className="h-4 w-4" />;
      break;
  }

  return (
    <div className={cn(alertBoxVariants({ variant }), className)} {...props}>
      {icon || defaultIcon}
      <div className="flex flex-col gap-1">
        {title && (
          <h5 className="font-medium leading-none tracking-tight">{title}</h5>
        )}
        <div className="text-sm [&_p]:leading-relaxed">{children}</div>
      </div>
      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Fermer</span>
        </Button>
      )}
    </div>
  );
}
