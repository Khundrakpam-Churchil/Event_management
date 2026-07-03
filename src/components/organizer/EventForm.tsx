"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateEventInputSchema, type CreateEventInput } from "@/src/lib/schemas/event.schema";
import { apiClient, ApiClientError } from "@/src/lib/api/client";

interface Venue { id: string; name: string; city: string; }
interface Category { id: string; name: string; }

interface EventFormProps {
  eventId?: string;          // if set → edit mode
  initialData?: Partial<CreateEventInput>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ eventId, initialData, onSuccess, onCancel }: EventFormProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateEventInput>({
    resolver: zodResolver(CreateEventInputSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    apiClient.get<Venue[]>("/venues").then((r) => setVenues(r.data)).catch(() => {});
    apiClient.get<Category[]>("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  async function onSubmit(data: CreateEventInput) {
    setServerError(null);
    try {
      if (eventId) {
        await apiClient.put(`/events/${eventId}`, data);
      } else {
        await apiClient.post("/events", data);
      }
      onSuccess();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Failed to save event.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">{serverError}</div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Title</label>
        <input {...register("title")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea {...register("description")} rows={3} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select {...register("categoryId")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Venue</label>
          <select {...register("venueId")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select…</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}, {v.city}</option>)}
          </select>
          {errors.venueId && <p className="text-xs text-destructive">{errors.venueId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Start Date &amp; Time</label>
          <input type="datetime-local" {...register("startDateTime")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {errors.startDateTime && <p className="text-xs text-destructive">{errors.startDateTime.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">End Date &amp; Time</label>
          <input type="datetime-local" {...register("endDateTime")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {errors.endDateTime && <p className="text-xs text-destructive">{errors.endDateTime.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Banner Image URL <span className="text-muted-foreground">(optional)</span></label>
        <input {...register("bannerImageUrl")} type="url" placeholder="https://…" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        {errors.bannerImageUrl && <p className="text-xs text-destructive">{errors.bannerImageUrl.message}</p>}
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {isSubmitting ? "Saving…" : eventId ? "Update Event" : "Create Event"}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 border rounded-md py-2 text-sm hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}
