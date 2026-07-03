import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/src/components/admin/AdminNav";
import { UsersTable } from "@/src/components/admin/UsersTable";

interface User { id: string; name: string; email: string; role: string; createdAt: string; }

async function fetchAdminData(token: string, path: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
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

  const users: User[] = await fetchAdminData(token, "/admin/users");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <AdminNav />

      <section>
        <h2 className="text-lg font-semibold mb-3">Users ({users.length})</h2>
        <UsersTable users={users} />
      </section>
    </div>
  );
}
