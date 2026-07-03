"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/src/lib/api/client";

interface Venue { id: string; name: string; address: string; city: string; capacity: number; }

export function VenuesPanel({ initialVenues }: { initialVenues: Venue[] }) {
  const [venues, setVenues] = useState<Venue[]>(initialVenues);
  const [form, setForm] = useState({ name: "", address: "", city: "", capacity: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const body = { ...form, capacity: Number(form.capacity) };
    try {
      if (editing) {
        const res = await apiClient.put<Venue>(`/venues/${editing}`, body);
        setVenues((p) => p.map((v) => (v.id === editing ? res.data : v)));
      } else {
        const res = await apiClient.post<Venue>("/venues", body);
        setVenues((p) => [...p, res.data]);
      }
      setForm({ name: "", address: "", city: "", capacity: "" });
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this venue?")) return;
    try {
      await apiClient.delete(`/venues/${id}`);
      setVenues((p) => p.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to delete.");
    }
  }

  function startEdit(v: Venue) {
    setEditing(v.id);
    setForm({ name: v.name, address: v.address, city: v.city, capacity: String(v.capacity) });
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</div>}

      {/* Inline form */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium">{editing ? "Edit Venue" : "Add Venue"}</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["name", "address", "city", "capacity"] as const).map((f) => (
            <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
              type={f === "capacity" ? "number" : "text"}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-primary text-primary-foreground px-3 py-1.5 text-sm rounded-md hover:bg-primary/90">
            {editing ? "Update" : "Add"}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm({ name: "", address: "", city: "", capacity: "" }); }}
            className="border px-3 py-1.5 text-sm rounded-md hover:bg-accent">Cancel</button>}
        </div>
      </div>

      {/* List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">City</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Capacity</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {venues.map((v) => (
              <tr key={v.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">{v.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{v.city}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{v.capacity.toLocaleString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => startEdit(v)} className="text-xs underline text-muted-foreground hover:text-foreground">Edit</button>
                  <button onClick={() => handleDelete(v.id)} className="text-xs underline text-destructive hover:text-destructive/80">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
