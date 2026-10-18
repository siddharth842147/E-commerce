"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/actions/addresses";
import type { Address } from "@/types/db";

const LABELS = ["Home", "Work", "Other"] as const;

interface AddressFormProps {
  defaultValues?: Partial<Address>;
  onSubmit: (fd: FormData) => Promise<void>;
  loading?: boolean;
}

export function AddressForm({ defaultValues, onSubmit, loading = false }: AddressFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<string>(defaultValues?.state ?? "");
  const [label, setLabel] = useState<string>(defaultValues?.label ?? "Home");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Inject controlled select values
    formData.set("state", state);
    formData.set("label", label);

    // Client-side validation
    const addressLine1 = (formData.get("addressLine1") as string).trim();
    const city = (formData.get("city") as string).trim();
    const postalCode = (formData.get("postalCode") as string).trim();

    if (!addressLine1) { setError("Address line 1 is required"); return; }
    if (!city) { setError("City is required"); return; }
    if (!state) { setError("State is required"); return; }
    if (!/^\d{6}$/.test(postalCode)) { setError("Postal code must be 6 digits"); return; }

    try {
      await onSubmit(formData);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Label */}
      <div className="space-y-1.5">
        <Label htmlFor="addr-label">Address Label</Label>
        <Select value={label} onValueChange={setLabel} name="label">
          <SelectTrigger id="addr-label" className="w-full">
            <SelectValue placeholder="Select label" />
          </SelectTrigger>
          <SelectContent>
            {LABELS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Address line 1 */}
      <div className="space-y-1.5">
        <Label htmlFor="addressLine1">Address Line 1 <span aria-hidden="true">*</span></Label>
        <Input
          id="addressLine1"
          name="addressLine1"
          required
          defaultValue={defaultValues?.addressLine1}
          placeholder="Building, Street"
          autoComplete="address-line1"
        />
      </div>

      {/* Address line 2 */}
      <div className="space-y-1.5">
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input
          id="addressLine2"
          name="addressLine2"
          defaultValue={defaultValues?.addressLine2 ?? ""}
          placeholder="Area, Landmark (optional)"
          autoComplete="address-line2"
        />
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City <span aria-hidden="true">*</span></Label>
          <Input
            id="city"
            name="city"
            required
            defaultValue={defaultValues?.city}
            placeholder="Mumbai"
            autoComplete="address-level2"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state-select">State <span aria-hidden="true">*</span></Label>
          <Select value={state} onValueChange={setState} name="state">
            <SelectTrigger id="state-select" className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Postal code */}
      <div className="space-y-1.5">
        <Label htmlFor="postalCode">Postal Code <span aria-hidden="true">*</span></Label>
        <Input
          id="postalCode"
          name="postalCode"
          required
          maxLength={6}
          pattern="\d{6}"
          inputMode="numeric"
          defaultValue={defaultValues?.postalCode}
          placeholder="400001"
          autoComplete="postal-code"
        />
      </div>

      {/* Is default */}
      <div className="flex items-center gap-2">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          value="on"
          defaultChecked={defaultValues?.isDefault ?? false}
          className="size-4 rounded border-border accent-primary"
        />
        <Label htmlFor="isDefault" className="cursor-pointer select-none">
          Set as default address
        </Label>
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Save Address"}
      </Button>
    </form>
  );
}
