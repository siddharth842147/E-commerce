import { getNotificationPreferences } from "@/actions/notifications";
import { NotificationsClient } from "./NotificationsClient";

export const instant = false;

export default async function NotificationsPage() {
  const result = await getNotificationPreferences();
  const prefs = result.success
    ? result.data
    : { email: true, sms: true, whatsapp: true };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which channels you&apos;d like to receive updates on
        </p>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <NotificationsClient initialPrefs={prefs} />
      </div>
    </div>
  );
}
