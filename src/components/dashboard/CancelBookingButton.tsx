"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/src/lib/api/client";

interface CancelBookingButtonProps {
  bookingId: string;
  status: string;
  onCancelled: () => void;
}

export function CancelBookingButton({ bookingId, status, onCancelled }: CancelBookingButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel = status === "CONFIRMED";

  if (!canCancel) return null;

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`);
      onCancelled();
      setConfirming(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Cancellation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            disabled={loading}
            className="text-xs border rounded px-2 py-1 hover:bg-accent disabled:opacity-50"
          >
            Keep booking
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-xs bg-destructive text-destructive-foreground rounded px-2 py-1 hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-destructive underline hover:text-destructive/80"
    >
      Cancel booking
    </button>
  );
}
