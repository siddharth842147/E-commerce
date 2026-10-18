"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircleIcon, ChevronRightIcon, TagIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { initiateRazorpayCheckout, placeCodOrderAction } from "@/lib/checkout-client";
import { previewCoupon, type CouponPreview } from "@/actions/coupon";
import type { ShippingAddress } from "@/types/checkout";

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

type Step = 1 | 2 | 3;

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, step, label }: { current: Step; step: Step; label: string }) {
  const done = current > step;
  const active = current === step;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          done
            ? "bg-primary text-primary-foreground"
            : active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <CheckCircleIcon className="size-4" /> : step}
      </div>
      <span
        className={`text-sm font-medium ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      {step < 3 && <ChevronRightIcon className="size-4 text-muted-foreground" />}
    </div>
  );
}

// ─── Address Form (Step 1) ────────────────────────────────────────────────────

interface AddressStepProps {
  address: Partial<ShippingAddress>;
  email: string;
  phone: string;
  onNext: (address: ShippingAddress, email: string, phone: string) => void;
}

function AddressStep({ address, email, phone, onNext }: AddressStepProps) {
  const [state, setState] = useState(address.state ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const recipientName = (fd.get("recipientName") as string).trim();
    const phone = (fd.get("phone") as string).trim();
    const addressLine1 = (fd.get("addressLine1") as string).trim();
    const addressLine2 = (fd.get("addressLine2") as string).trim() || undefined;
    const city = (fd.get("city") as string).trim();
    const postalCode = (fd.get("postalCode") as string).trim();
    const email = (fd.get("email") as string).trim();

    if (!recipientName) return setError("Recipient name is required");
    if (!phone || !/^\+?[0-9]{10,13}$/.test(phone)) return setError("Valid phone number is required");
    if (!addressLine1) return setError("Address line 1 is required");
    if (!city) return setError("City is required");
    if (!state) return setError("State is required");
    if (!/^\d{6}$/.test(postalCode)) return setError("Postal code must be 6 digits");

    onNext({ recipientName, phone, addressLine1, addressLine2, city, state, postalCode }, email, phone);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="recipientName">Full Name *</Label>
          <Input id="recipientName" name="recipientName" defaultValue={address.recipientName} placeholder="Jane Doe" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkout-phone">Phone *</Label>
          <Input id="checkout-phone" name="phone" defaultValue={address.phone ?? phone} placeholder="9876543210" inputMode="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkout-email">Email (for order updates)</Label>
        <Input id="checkout-email" name="email" type="email" defaultValue={email} placeholder="jane@example.com" autoComplete="email" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine1">Address Line 1 *</Label>
        <Input id="addressLine1" name="addressLine1" defaultValue={address.addressLine1} placeholder="Building, Street" autoComplete="address-line1" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input id="addressLine2" name="addressLine2" defaultValue={address.addressLine2 ?? ""} placeholder="Area, Landmark (optional)" autoComplete="address-line2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="checkout-city">City *</Label>
          <Input id="checkout-city" name="city" defaultValue={address.city} placeholder="Mumbai" autoComplete="address-level2" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkout-state">State *</Label>
          <Select value={state} onValueChange={setState} name="state">
            <SelectTrigger id="checkout-state" className="w-full">
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

      <div className="space-y-1.5">
        <Label htmlFor="postalCode">Postal Code *</Label>
        <Input id="postalCode" name="postalCode" defaultValue={address.postalCode} placeholder="400001" maxLength={6} inputMode="numeric" autoComplete="postal-code" />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" size="lg">
        Continue to Coupon
      </Button>
    </form>
  );
}

// ─── Coupon Step (Step 2) ─────────────────────────────────────────────────────

interface CouponStepProps {
  appliedCoupon: CouponPreview | null;
  onApply: (coupon: CouponPreview | null) => void;
  onNext: () => void;
  onBack: () => void;
}

function CouponStep({ appliedCoupon, onApply, onNext, onBack }: CouponStepProps) {
  const [code, setCode] = useState(appliedCoupon?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    if (!code.trim()) {
      setError("Please enter a coupon code");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await previewCoupon(code);
      if (res.success) {
        onApply(res.data);
        toast.success(`Coupon "${res.data.code}" applied!`);
      } else {
        setError(res.error);
        onApply(null);
      }
    });
  }

  function handleRemove() {
    setCode("");
    onApply(null);
    toast.info("Coupon removed");
  }

  function formatDiscount(coupon: CouponPreview): string {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% off`;
    }
    return `₹${parseFloat(coupon.discountValue).toFixed(2)} off`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-medium">Have a coupon code?</h3>
        <p className="text-sm text-muted-foreground">Enter your coupon code to apply a discount.</p>
      </div>

      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="COUPON CODE"
          className="font-mono uppercase"
          disabled={!!appliedCoupon || isPending}
        />
        {appliedCoupon ? (
          <Button variant="outline" onClick={handleRemove}>
            Remove
          </Button>
        ) : (
          <Button onClick={handleApply} disabled={isPending}>
            {isPending ? "Checking…" : "Apply"}
          </Button>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {appliedCoupon && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <TagIcon className="size-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">
              {appliedCoupon.code} — {formatDiscount(appliedCoupon)}
            </p>
            <p className="text-xs text-muted-foreground">
              Saves ₹{appliedCoupon.discountAmount.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}

// ─── Payment Step (Step 3) ────────────────────────────────────────────────────

interface PaymentStepProps {
  shippingAddress: ShippingAddress;
  email: string;
  phone: string;
  couponCode?: string;
  onBack: () => void;
}

function PaymentStep({ shippingAddress, email, phone, couponCode, onBack }: PaymentStepProps) {
  const router = useRouter();
  const [isPendingRzp, startRzp] = useTransition();
  const [isPendingCod, startCod] = useTransition();

  function handleRazorpay() {
    startRzp(async () => {
      const result = await initiateRazorpayCheckout({
        shippingAddress,
        email,
        phone,
        couponCode,
        name: "Kartiva",
        prefill: { name: shippingAddress.recipientName, email, contact: phone },
      });

      if (result.success && result.orderId) {
        router.push(`/checkout/success?orderId=${result.orderId}`);
      } else {
        toast.error(result.error ?? "Payment failed. Please try again.");
      }
    });
  }

  function handleCod() {
    startCod(async () => {
      const result = await placeCodOrderAction({
        shippingAddress,
        email,
        phone,
        couponCode,
      });

      if (result.success) {
        router.push(`/checkout/success?orderId=${result.data.orderId}`);
      } else {
        toast.error(result.error ?? "Failed to place order. Please try again.");
      }
    });
  }

  const isLoading = isPendingRzp || isPendingCod;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-semibold">Choose Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Your payment is secure and encrypted.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Razorpay */}
        <button
          type="button"
          onClick={handleRazorpay}
          disabled={isLoading}
          className="flex items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-60"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            ₹
          </div>
          <div>
            <p className="text-sm font-semibold">Pay Online</p>
            <p className="text-xs text-muted-foreground">
              Credit/Debit card, UPI, Net Banking via Razorpay
            </p>
          </div>
          {isPendingRzp && (
            <span className="ml-auto text-xs text-muted-foreground">Opening…</span>
          )}
        </button>

        {/* COD */}
        <button
          type="button"
          onClick={handleCod}
          disabled={isLoading}
          className="flex items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-colors hover:border-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-sm font-bold">
            🚚
          </div>
          <div>
            <p className="text-sm font-semibold">Cash on Delivery</p>
            <p className="text-xs text-muted-foreground">
              Pay when your order arrives
            </p>
          </div>
          {isPendingCod && (
            <span className="ml-auto text-xs text-muted-foreground">Placing…</span>
          )}
        </button>
      </div>

      <Button variant="outline" onClick={onBack} className="w-full" disabled={isLoading}>
        Back
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By placing your order, you agree to our terms and conditions.
      </p>
    </div>
  );
}

// ─── Order Summary Sidebar ────────────────────────────────────────────────────

function OrderSummary({ coupon }: { coupon: CouponPreview | null }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-4 text-base font-semibold">Order Summary</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>Calculated at placement</span>
        </div>
        {coupon && (
          <div className="flex justify-between text-primary">
            <span>Discount ({coupon.code})</span>
            <span>-₹{coupon.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>GST</span>
          <span>Included</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>Calculated at placement</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>(1);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);

  function handleAddressNext(addr: ShippingAddress, em: string, ph: string) {
    setShippingAddress(addr);
    setEmail(em);
    setPhone(ph);
    setStep(2);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Checkout</h1>

      {/* Step indicator */}
      <div className="mb-8 flex flex-wrap items-center gap-2 sm:gap-4">
        <StepIndicator current={step} step={1} label="Shipping" />
        <StepIndicator current={step} step={2} label="Coupon" />
        <StepIndicator current={step} step={3} label="Payment" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main form area */}
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border bg-card p-6">
            {step === 1 && (
              <>
                <h2 className="mb-4 text-base font-semibold">Shipping Address</h2>
                <AddressStep
                  address={shippingAddress ?? {}}
                  email={email}
                  phone={phone}
                  onNext={handleAddressNext}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="mb-4 text-base font-semibold">Coupon Code</h2>
                <CouponStep
                  appliedCoupon={appliedCoupon}
                  onApply={setAppliedCoupon}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              </>
            )}

            {step === 3 && shippingAddress && (
              <>
                <h2 className="mb-4 text-base font-semibold">Payment</h2>
                {/* Delivery summary */}
                <div className="mb-6 rounded-lg bg-muted/40 p-4 text-sm">
                  <p className="font-medium">{shippingAddress.recipientName}</p>
                  <p className="text-muted-foreground">
                    {shippingAddress.addressLine1}
                    {shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.postalCode}
                  </p>
                </div>
                <PaymentStep
                  shippingAddress={shippingAddress}
                  email={email}
                  phone={phone}
                  couponCode={appliedCoupon?.code}
                  onBack={() => setStep(2)}
                />
              </>
            )}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="w-full shrink-0 lg:w-72">
          <OrderSummary coupon={appliedCoupon} />
        </div>
      </div>
    </div>
  );
}
