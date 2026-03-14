import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "destructive" | "secondary";
type ButtonSize = "default" | "sm" | "xs";

const variantStyles: Record<ButtonVariant, string> = {
  default: "btn-primary",
  outline: "btn-ghost",
  destructive: "btn-danger",
  secondary: "btn-secondary",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "text-sm",
  sm: "px-3 py-2 text-xs",
  xs: "px-2.5 py-1.5 text-xs",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
