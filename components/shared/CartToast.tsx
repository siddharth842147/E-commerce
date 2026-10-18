"use client";

import { useEffect, useState } from "react";

interface ToastData {
  title: string;
  subtitle: string;
  visible: boolean;
}

export function showCartToast(title: string, subtitle: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("kartiva-cart-toast", {
        detail: { title, subtitle },
      })
    );
  }
}

export function CartToast() {
  const [toast, setToast] = useState<ToastData>({
    title: "",
    subtitle: "",
    visible: false,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; subtitle: string }>;
      setToast({
        title: customEvent.detail.title,
        subtitle: customEvent.detail.subtitle,
        visible: true,
      });

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
    };

    window.addEventListener("kartiva-cart-toast", handleToast);
    return () => {
      window.removeEventListener("kartiva-cart-toast", handleToast);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transform transition-all duration-300 pointer-events-none ${
        toast.visible
          ? "translate-y-0 opacity-100"
          : "translate-y-24 opacity-0"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[18px]">check</span>
      </div>
      <div className="flex flex-col">
        <span className="font-label-md text-label-md font-bold">{toast.title}</span>
        <span className="font-body-sm text-[12px] opacity-80">{toast.subtitle}</span>
      </div>
    </div>
  );
}
