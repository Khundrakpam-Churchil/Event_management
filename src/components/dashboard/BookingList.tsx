"use client";

import { useState } from "react";
import { BookingDetail } from "./BookingDetail";
import { CancelBookingButton } from "./CancelBookingButton";

interface Ticket {
  id: string;
  ticketCode: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
}

interface BookingItem {
  id: string;
  quantity: number;
  unitPrice: number;
  ticketType: { name: string };
  tickets: Ticket[];
}

interface Event {
  title: string;
  startDateTime: string;
}

export interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  totalAmount: number;
  createdAt: string;
  event: Event;
  bookingItems: BookingItem[];
  payment?: { status: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-700",
};

interface BookingListProps {
  bookings: Booking[];
}

export function BookingList({ bookings }: BookingListProps) {
  const [selected, setSelected] = useState<Booking | null>(null);
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);

  function handleCancelled(bookingId: string) {
    setLocalBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
    );
    if (selected?.id === bookingId) {
      setSelected((prev) => prev ? { ...prev, status: "CANCELLED" } : null);
    }
  }

  if (localBookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        You have no bookings yet.{" "}
        <a href="/" className="underline hover:text-foreground">Browse events</a>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {localBookings.map((booking) => (
          <div
            key={booking.id}
            className="border rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-accent/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{booking.event.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(booking.event.startDateTime).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric", year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ${Number(booking.totalAmount).toFixed(2)} ·{" "}
                {booking.bookingItems.reduce((s, i) => s + i.quantity, 0)} ticket(s)
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[booking.status] ?? ""}`}>
                {booking.status}
              </span>

              <button
                onClick={() => setSelected(booking)}
                className="text-xs underline text-muted-foreground hover:text-foreground"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer/modal */}
      {selected && (
        <BookingDetail
          booking={selected}
          onClose={() => setSelected(null)}
          cancelButton={
            <CancelBookingButton
              bookingId={selected.id}
              status={selected.status}
              onCancelled={() => handleCancelled(selected.id)}
            />
          }
        />
      )}
    </>
  );
}
