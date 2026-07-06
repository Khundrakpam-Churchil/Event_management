"use client";

import { Users, TrendingUp } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function JoiningDashboard({ users }: { users: User[] }) {
  // Get recent 5 users
  const recentUsers = users.slice(0, 5);

  return (
    <section className="glass rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Joining Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of recently registered users.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          {users.length} Total Users
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple text-based visual since Recharts might not be installed */}
        <div className="border rounded-xl p-5 bg-muted/10 flex flex-col justify-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Growth Summary</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight text-emerald-500">
              +{recentUsers.length}
            </span>
            <span className="text-sm text-muted-foreground pb-1">new users recently</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            The community is growing! Keep an eye on new signups to upgrade potential organizers.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Latest Signups</h3>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                    {u.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
