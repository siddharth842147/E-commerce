"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/actions/addresses";
import { INDIAN_STATES } from "@/lib/constants/india";
import type { Address } from "@/types/db";
import { MapPin, Plus, Trash2, Star } from "lucide-react";

interface AddressesClientProps {
  initialAddresses: Address[];
}

export function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const [addressList, setAddressList] = useState<Address[]>(initialAddresses);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("state", state);
    startTransition(async () => {
      const result = await createAddress(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setAddressList((prev) => [...prev, result.data]);
        setOpen(false);
        setState("");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddress(id);
      if (result.success) {
        setAddressList((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultAddress(id);
      if (result.success) {
        setAddressList((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      {addressList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No saved addresses yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addressList.map((addr) => (
            <div key={addr.id} className="relative rounded-lg border bg-card p-4">
              {addr.isDefault && (
                <Badge variant="secondary" className="absolute right-3 top-3 text-xs">
                  Default
                </Badge>
              )}
              <p className="font-medium">{addr.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{addr.addressLine1}</p>
              {addr.addressLine2 && (
                <p className="text-sm text-muted-foreground">{addr.addressLine2}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {addr.city}, {addr.state} {addr.postalCode}
              </p>
              <div className="mt-3 flex gap-2">
                {!addr.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={isPending}
                    aria-label="Set as default address"
                  >
                    <Star className="mr-1 h-3 w-3" />
                    Set default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(addr.id)}
                  disabled={isPending}
                  aria-label="Delete address"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add address
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add new address</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="label">Label</Label>
                <Input id="label" name="label" defaultValue="Home" disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="400001"
                  maxLength={6}
                  inputMode="numeric"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                placeholder="Flat / House no., Street"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                placeholder="Area, Landmark"
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Mumbai" required disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select value={state} onValueChange={setState} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !state}>
                {isPending ? "Saving…" : "Save address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
