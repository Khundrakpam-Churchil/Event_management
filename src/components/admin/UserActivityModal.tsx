"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Ticket } from "lucide-react";
import { apiClient } from "@/src/lib/api/client";

interface UserActivityModalProps {
  user: { id: string; name: string };
  onClose: () => void;
}

export function UserActivityModal({ user, onClose }: UserActivityModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await apiClient.get<any>(`/admin/users/${user.id}/activity`);
        setData(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load activity");
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl relative animate-fade-in-up">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">User Activity</h2>
            <p className="text-sm text-muted-foreground mt-1">Activity for {user.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading activity...</p>
          ) : error ? (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          ) : (
            <>
              {/* Bookings */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-medium mb-3">
                  <Ticket className="w-5 h-5 text-primary" />
                  Recent Bookings ({data.bookings.length})
                </h3>
                {data.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg">
                    No bookings found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.bookings.map((b: any) => (
                      <div key={b.id} className="border rounded-lg p-3 flex justify-between items-center bg-muted/10">
                        <div>
                          <p className="font-medium text-sm">{b.event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" :
                          b.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Events Created */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-medium mb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  Events Created ({data.createdEvents.length})
                </h3>
                {data.createdEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg">
                    No events created.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.createdEvents.map((e: any) => (
                      <div key={e.id} className="border rounded-lg p-3 flex justify-between items-center bg-muted/10">
                        <div>
                          <p className="font-medium text-sm">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(e.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          e.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
