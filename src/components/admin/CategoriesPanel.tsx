"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/src/lib/api/client";

interface Category { id: string; name: string; }

export function CategoriesPanel({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      if (editing) {
        const res = await apiClient.put<Category>(`/categories/${editing}`, { name });
        setCategories((p) => p.map((c) => (c.id === editing ? res.data : c)));
      } else {
        const res = await apiClient.post<Category>("/categories", { name });
        setCategories((p) => [...p, res.data]);
      }
      setName("");
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await apiClient.delete(`/categories/${id}`);
      setCategories((p) => p.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to delete.");
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      {error && <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</div>}

      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name"
          className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button onClick={handleSave} className="bg-primary text-primary-foreground px-3 py-1.5 text-sm rounded-md hover:bg-primary/90">
          {editing ? "Update" : "Add"}
        </button>
        {editing && <button onClick={() => { setEditing(null); setName(""); }}
          className="border px-3 py-1.5 text-sm rounded-md hover:bg-accent">Cancel</button>}
      </div>

      <div className="border rounded-lg divide-y">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm">{c.name}</span>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(c.id); setName(c.name); }} className="text-xs underline text-muted-foreground hover:text-foreground">Edit</button>
              <button onClick={() => handleDelete(c.id)} className="text-xs underline text-destructive hover:text-destructive/80">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
