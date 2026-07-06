"use client";

import { useState } from "react";
import { EditUserModal } from "./EditUserModal";
import { UserActivityModal } from "./UserActivityModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UsersTable({ users }: { users: User[] }) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activityUser, setActivityUser] = useState<User | null>(null);

  // We handle updates by simply reloading the window for now to fetch fresh data
  const handleUpdate = () => {
    setEditingUser(null);
    window.location.reload();
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Joined</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                    u.role === "ORGANIZER" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-700"
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setActivityUser(u)}
                    className="text-primary hover:underline text-xs font-medium mr-3"
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setEditingUser(u)}
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={handleUpdate}
        />
      )}

      {activityUser && (
        <UserActivityModal
          user={activityUser}
          onClose={() => setActivityUser(null)}
        />
      )}
    </>
  );
}
