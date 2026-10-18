"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPreferences } from "@/actions/notifications";

interface NotificationsClientProps {
  initialPrefs: { email: boolean; sms: boolean; whatsapp: boolean };
}

export function NotificationsClient({ initialPrefs }: NotificationsClientProps) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(channel: "email" | "sms" | "whatsapp", value: boolean) {
    const next = { ...prefs, [channel]: value };
    setPrefs(next);
    setSaved(false);
    startTransition(async () => {
      await updateNotificationPreferences(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const channels = [
    {
      key: "email" as const,
      label: "Email notifications",
      description: "Order updates, invoices, and account alerts via email",
    },
    {
      key: "sms" as const,
      label: "SMS notifications",
      description: "Order status updates via text message",
    },
    {
      key: "whatsapp" as const,
      label: "WhatsApp notifications",
      description: "Order updates via WhatsApp",
    },
  ];

  return (
    <div className="space-y-6">
      {channels.map((ch) => (
        <div key={ch.key} className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor={`switch-${ch.key}`} className="text-base font-medium">
              {ch.label}
            </Label>
            <p className="text-sm text-muted-foreground">{ch.description}</p>
          </div>
          <Switch
            id={`switch-${ch.key}`}
            checked={prefs[ch.key]}
            onCheckedChange={(val) => toggle(ch.key, val)}
            disabled={isPending}
            aria-label={ch.label}
          />
        </div>
      ))}
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">Preferences saved</p>
      )}
    </div>
  );
}
