"use client";

import { ComponentPropsWithoutRef } from "react";
import { Root } from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export function Label({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Root> & VariantProps<typeof labelVariants>) {
  return <Root className={cn(labelVariants(), className)} {...props} />;
}
