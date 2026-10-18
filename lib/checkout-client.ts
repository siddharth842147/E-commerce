"use client";

import type { ShippingAddress } from "@/types/checkout";
import type { ApiResponse } from "@/lib/api-response";
import { placeCodOrder } from "@/actions/checkout";

// --- Types ---

export interface CheckoutClientResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export interface InitiateRazorpayOptions {
  shippingAddress: ShippingAddress;
  email?: string;
  phone?: string;
  couponCode?: string;
  items?: { variantId: string; quantity: number }[];
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

// Razorpay modal instance type (minimal — the SDK injects window.Razorpay)
interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    modal: {
      ondismiss: () => void;
    };
  }): RazorpayInstance;
}

// --- SDK loader ---

let razorpayScriptLoaded = false;

/**
 * Dynamically loads the Razorpay checkout script and resolves when
 * window.Razorpay is available. Idempotent — only loads once.
 */
function loadRazorpayScript(): Promise<void> {
  const rzpWindow = typeof window !== "undefined" ? (window as unknown as { Razorpay?: unknown }) : undefined;
  if (razorpayScriptLoaded && rzpWindow?.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Document not available"));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      razorpayScriptLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error("Failed to load Razorpay checkout script"));
    };

    document.head.appendChild(script);
  });
}

// --- Checkout functions ---

/**
 * Initiates a Razorpay checkout flow.
 *
 * SECURITY: The client success callback from the Razorpay modal is NOT trusted.
 * It only POSTs the payment response to the server verify route. The server
 * performs HMAC-SHA256 signature verification and only then updates the
 * order/payment status. This function returns success only if the server
 * confirms the payment.
 *
 * Flow:
 *  1. POST to /api/payments/create-order → get Razorpay order id + key
 *  2. Load the Razorpay checkout script
 *  3. Open the Razorpay modal
 *  4. On modal success: POST to /api/payments/verify with the payment response
 *  5. Return success only if the server verify response is success
 *  6. On modal dismiss: return { success: false, error: "Payment cancelled" }
 *
 * @param options - Checkout options including shipping address and contact info
 * @returns CheckoutClientResult with success status and order id or error
 */
export async function initiateRazorpayCheckout(
  options: InitiateRazorpayOptions
): Promise<CheckoutClientResult> {
  // 1. Create the Razorpay order on the server
  let createRes;
  try {
    const cleanPhone = (options.phone || options.shippingAddress.phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
    const cleanAddressPhone = (options.shippingAddress.phone || cleanPhone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
    const cleanEmail = options.email?.trim() || undefined;
    const cleanCoupon = options.couponCode?.trim() || undefined;

    const response = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddress: {
          ...options.shippingAddress,
          phone: cleanAddressPhone,
        },
        email: cleanEmail,
        phone: cleanPhone || undefined,
        couponCode: cleanCoupon,
        items: options.items,
      }),
    });
    createRes = await response.json();
  } catch {
    return { success: false, error: "Failed to create order" };
  }

  if (!createRes.success || !createRes.data) {
    return {
      success: false,
      error: createRes.error ?? "Failed to create order",
    };
  }

  const {
    orderId,
    razorpayOrderId,
    amount,
    currency,
    keyId,
  } = createRes.data as {
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };

  const isMockTest =
    !keyId ||
    keyId === "rzp_test_mock" ||
    keyId.startsWith("rzp_test_placeholder") ||
    razorpayOrderId.startsWith("order_test_");

  if (isMockTest) {
    return new Promise<CheckoutClientResult>((resolve) => {
      const modalId = "kartiva-rzp-test-modal";
      const existing = document.getElementById(modalId);
      if (existing) existing.remove();

      const modalEl = document.createElement("div");
      modalEl.id = modalId;
      modalEl.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4";
      modalEl.innerHTML = `
        <div class="w-full max-w-md rounded-2xl bg-background border border-border p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between border-b border-border pb-4">
            <div class="flex items-center gap-2">
              <span class="flex size-7 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs">R</span>
              <span class="font-bold text-foreground text-base tracking-tight">Razorpay</span>
              <span class="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">TEST MODE</span>
            </div>
            <span class="text-xs text-muted-foreground font-mono">${currency}</span>
          </div>
          <div class="rounded-xl bg-muted/50 p-4 space-y-2 border border-border/50">
            <div class="flex justify-between items-center">
              <span class="text-xs text-muted-foreground">Order ID</span>
              <span class="text-xs font-mono font-medium">${orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-muted-foreground">Total Payable</span>
              <span class="text-lg font-bold text-foreground">₹${(amount / 100).toFixed(2)}</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Razorpay Sandbox test mode simulation. Click below to authorize simulated test payment or cancel.
          </p>
          <div class="flex flex-col gap-2 pt-2">
            <button
              id="simulate-rzp-success"
              type="button"
              class="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
            >
              Simulate Successful Payment (Test Mode)
            </button>
            <button
              id="simulate-rzp-cancel"
              type="button"
              class="w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modalEl);

      const successBtn = document.getElementById("simulate-rzp-success");
      const cancelBtn = document.getElementById("simulate-rzp-cancel");

      const cleanup = () => {
        modalEl.remove();
      };

      cancelBtn?.addEventListener("click", () => {
        cleanup();
        resolve({ success: false, error: "Payment cancelled by user" });
      });

      successBtn?.addEventListener("click", async () => {
        if (successBtn) {
          successBtn.setAttribute("disabled", "true");
          successBtn.textContent = "Verifying test payment…";
        }
        try {
          const fakePaymentId = `pay_test_${Math.random().toString(36).substring(2, 11)}`;
          const fakeSignature = `test_sig_${Math.random().toString(36).substring(2, 11)}`;
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: fakePaymentId,
              razorpay_signature: fakeSignature,
              orderId,
            }),
          });
          const verifyRes = await verifyResponse.json();
          cleanup();
          if (verifyRes.success) {
            resolve({ success: true, orderId });
          } else {
            resolve({
              success: false,
              error: verifyRes.error ?? "Payment verification failed",
            });
          }
        } catch {
          cleanup();
          resolve({ success: false, error: "Could not verify payment" });
        }
      });
    });
  }

  // 2. Load the Razorpay checkout script
  try {
    await loadRazorpayScript();
  } catch {
    return { success: false, error: "Failed to load payment SDK" };
  }

  // 3. Open the Razorpay modal and wait for the result
  return new Promise<CheckoutClientResult>((resolve) => {
    const RazorpayConstructor = (
      typeof window !== "undefined"
        ? (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay
        : undefined
    );

    if (!RazorpayConstructor) {
      resolve({ success: false, error: "Payment SDK not available" });
      return;
    }

    const rzp = new RazorpayConstructor({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: options.name ?? "Kartiva",
      description: options.description,
      prefill: options.prefill,
      handler: async (response) => {
        // 4. Client success is NOT trusted — send to server for verification.
        try {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            }),
          });
          const verifyRes = await verifyResponse.json();

          if (verifyRes.success) {
            resolve({ success: true, orderId });
          } else {
            resolve({
              success: false,
              error: verifyRes.error ?? "Payment verification failed",
            });
          }
        } catch {
          resolve({ success: false, error: "Could not verify payment" });
        }
      },
      modal: {
        ondismiss: () => {
          resolve({ success: false, error: "Payment cancelled" });
        },
      },
    });

    rzp.open();
  });
}

/**
 * Places a Cash on Delivery (COD) order.
 *
 * Thin client wrapper around the placeCodOrder server action. Server actions
 * are directly callable from client components, so this just delegates for
 * consistent error handling and a unified checkout interface.
 *
 * @param input - Checkout data including shipping address and contact info
 * @returns ApiResponse<{ orderId: string }>
 */
export async function placeCodOrderAction(input: {
  shippingAddress: ShippingAddress;
  email?: string;
  phone?: string;
  couponCode?: string;
  items?: { variantId: string; quantity: number }[];
}): Promise<ApiResponse<{ orderId: string }>> {
  const cleanPhone = (input.phone || input.shippingAddress.phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  const cleanAddressPhone = (input.shippingAddress.phone || cleanPhone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  const cleanEmail = input.email?.trim() || undefined;
  const cleanCoupon = input.couponCode?.trim() || undefined;

  return placeCodOrder({
    ...input,
    shippingAddress: {
      ...input.shippingAddress,
      phone: cleanAddressPhone,
    },
    email: cleanEmail,
    phone: cleanPhone || undefined,
    couponCode: cleanCoupon,
  });
}
