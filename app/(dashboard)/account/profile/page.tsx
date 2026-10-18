import { getProfile } from "@/actions/account";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-xl font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          aria-label="Avatar"
        >
          {profile?.fullName
            ? profile.fullName.charAt(0).toUpperCase()
            : profile?.email?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-medium">{profile?.fullName ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ProfileForm
          initialFullName={profile?.fullName ?? ""}
          initialPhone={profile?.phone ?? ""}
        />
      </div>
    </div>
  );
}
