"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/src/lib/api/client";
import { useBookingStore } from "@/src/lib/stores/booking.store";
import type { BookingIntent } from "@/src/lib/stores/booking.store";

interface CheckoutFormProps {
  intent: BookingIntent;
}

export function CheckoutForm({ intent }: CheckoutFormProps) {
  const router = useRouter();
  const { clearIntent } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/bookings", {
        eventId: intent.eventId,
        items: intent.items.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
        })),
      });

      clearIntent();
      router.push("/dashboard?booked=1");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "INSUFFICIENT_INVENTORY") {
          setError("Sorry, some tickets are no longer available. Please go back and reselect.");
        } else if (err.code === "EVENT_NOT_BOOKABLE") {
          setError("This event is no longer available for booking.");
        } else if (err.code === "TICKET_SALES_CLOSED") {
          setError("Ticket sales for this event have closed.");
        } else {
          setError(err.message || "Booking failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
          {error}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        By confirming, you agree to purchase the tickets listed above. This action is final.
      </p>

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Processing…" : "Confirm & Pay"}
      </button>

      <button
        onClick={() => router.back()}
        disabled={loading}
        className="w-full border rounded-md py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
      >
        Go back
      </button>
    </div>
  );
}
