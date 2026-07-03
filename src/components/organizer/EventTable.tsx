"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient, ApiClientError } from "@/src/lib/api/client";
import { EventForm } from "./EventForm";

interface Event {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  startDateTime: string;
  endDateTime: string;
  categoryId: string;
  venueId: string;
  description: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

interface EventTableProps {
  initialEvents: Event[];
}

export function EventTable({ initialEvents }: EventTableProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [editing, setEditing] = useState<Event | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: string) {
    setError(null);
    try {
      const res = await apiClient.patch<Event>(`/events/${id}`, { status });
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: res.data.status } : e)));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setError(null);
    try {
      await apiClient.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to delete event.");
    }
  }

  function handleSaved() {
    setCreating(false);
    setEditing(null);
    // Reload by navigating — simple full refresh
    window.location.reload();
  }

  if (creating || editing) {
    return (
      <div className="border rounded-lg p-6 max-w-2xl">
        <h2 className="font-semibold mb-4">{editing ? "Edit Event" : "New Event"}</h2>
        <EventForm
          eventId={editing?.id}
          initialData={editing ? {
            title: editing.title,
            description: editing.description,
            categoryId: editing.categoryId,
            venueId: editing.venueId,
            startDateTime: editing.startDateTime,
            endDateTime: editing.endDateTime,
          } : undefined}
          onSuccess={handleSaved}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">My Events</h2>
        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm hover:bg-primary/90"
        >
          + New Event
        </button>
      </div>

      {error && <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</div>}

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No events yet. Create your first event!</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium truncate max-w-[200px]">{event.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[event.status] ?? ""}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(event.startDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditing(event)} className="text-xs underline text-muted-foreground hover:text-foreground">Edit</button>
                      {event.status === "DRAFT" && (
                        <button onClick={() => handleStatusChange(event.id, "PUBLISHED")} className="text-xs underline text-green-700 hover:text-green-900">Publish</button>
                      )}
                      {event.status === "PUBLISHED" && (
                        <button onClick={() => handleStatusChange(event.id, "CANCELLED")} className="text-xs underline text-yellow-700 hover:text-yellow-900">Cancel</button>
                      )}
                      <Link href={`/organizer/events/${event.id}/attendees`} className="text-xs underline text-muted-foreground hover:text-foreground">Attendees</Link>
                      <button onClick={() => handleDelete(event.id)} className="text-xs underline text-destructive hover:text-destructive/80">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
