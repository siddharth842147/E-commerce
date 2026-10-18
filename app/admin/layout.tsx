import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const metadata = {
  title: "Admin Console | Kartiva",
  description: "Kartiva Store Administration Dashboard",
};

// All /admin routes access cookies/auth — opt out of static prerender in Next 16
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {/* Fixed / Sticky Desktop Sidebar */}
      <AdminSidebar
        adminEmail={profile.email}
        adminName={profile.fullName || "Admin"}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader
          adminEmail={profile.email}
          adminName={profile.fullName || "Admin"}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
