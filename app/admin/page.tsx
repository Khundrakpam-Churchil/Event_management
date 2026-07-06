"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/lib/stores/auth.store";
import { apiClient } from "@/src/lib/api/client";
import { AdminNav } from "@/src/components/admin/AdminNav";
import { UsersTable } from "@/src/components/admin/UsersTable";
import { AdminDashboardStats } from "@/src/components/admin/AdminDashboardStats";
import { JoiningDashboard } from "@/src/components/admin/JoiningDashboard";

interface User { id: string; name: string; email: string; role: string; createdAt: string; }
interface Stats { totalUsers: number; totalEvents: number; totalBookings: number; totalRevenue: number; }

export default function AdminPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple auth check — no cookies, no middleware, no server round-trip
    if (!token || !user) {
      router.replace("/login?returnUrl=/admin");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/");
      return;
    }

    // Fetch admin data using apiClient (auto-attaches Bearer token)
    async function loadData() {
      try {
        const [usersRes, statsRes] = await Promise.all([
          apiClient.get<User[]>("/admin/users"),
          apiClient.get<Stats>("/admin/stats"),
        ]);
        setUsers(usersRes.data ?? []);
        setStats(statsRes.data ?? null);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, user, router]);

  if (!user || user.role !== "ADMIN") return null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-muted-foreground text-center py-20">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, view stats, and oversee events.</p>
      </div>
      <AdminNav />

      {stats && <AdminDashboardStats stats={stats} />}

      <JoiningDashboard users={users} />

      <section className="glass rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Users ({users.length})</h2>
        <UsersTable users={users} />
      </section>
    </div>
  );
}

