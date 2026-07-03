import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/src/components/admin/AdminNav";
import { UsersTable } from "@/src/components/admin/UsersTable";
import { AdminDashboardStats } from "@/src/components/admin/AdminDashboardStats";

interface User { id: string; name: string; email: string; role: string; createdAt: string; }

async function fetchAdminData(token: string, path: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) redirect("/login?returnUrl=/admin");

  // Verify admin role
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!meRes.ok) redirect("/login?returnUrl=/admin");
  const meJson = await meRes.json();
  if (meJson.data?.user?.role !== "ADMIN") redirect("/");

  const [users, stats] = await Promise.all([
    fetchAdminData(token, "/admin/users"),
    fetchAdminData(token, "/admin/stats"),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, view stats, and oversee events.</p>
      </div>
      <AdminNav />

      {stats && <AdminDashboardStats stats={stats} />}

      <section className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Users ({users?.length ?? 0})</h2>
        <UsersTable users={users ?? []} />
      </section>
    </div>
  );
}
