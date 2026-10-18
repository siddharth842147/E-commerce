"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  className?: string;
}

export function QuantitySelector({ value, min = 1, max, onChange, className }: QuantitySelectorProps) {
  const canDecrement = value > min;
  const canIncrement = max === undefined || value < max;

  function clamp(n: number): number {
    let result = n;
    if (result < min) result = min;
    if (max !== undefined && result > max) result = max;
    return result;
  }

  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-md border bg-background", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(clamp(value - 1))}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
      >
        <MinusIcon className="size-3.5" />
      </Button>

      <span
        className="min-w-[2rem] text-center text-sm font-medium tabular-nums"
        aria-live="polite"
        aria-label={`Quantity: ${value}`}
      >
        {value}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(clamp(value + 1))}
        disabled={!canIncrement}
        aria-label="Increase quantity"
      >
        <PlusIcon className="size-3.5" />
      </Button>
    </div>
  );
}
