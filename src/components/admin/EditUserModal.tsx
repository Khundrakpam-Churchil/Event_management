"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiClient } from "@/src/lib/api/client";

interface EditUserModalProps {
  user: { id: string; name: string; role: string };
  onClose: () => void;
  onUpdate: () => void;
}

export function EditUserModal({ user, onClose, onUpdate }: EditUserModalProps) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.patch(`/admin/users/${user.id}`, { role });
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl w-full max-w-sm shadow-xl p-6 relative animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Edit User Role</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update role for <strong>{user.name}</strong>.
        </p>

        {error && (
          <div className="mb-4 p-2 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="USER">User</option>
              <option value="ORGANIZER">Organizer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || role === user.role}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
