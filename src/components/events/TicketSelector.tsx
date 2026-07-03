"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/src/lib/stores/booking.store";
import { useAuthStore } from "@/src/lib/stores/auth.store";

interface TicketType {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  quantitySold: number;
  salesStart: string;
  salesEnd: string;
}

interface TicketSelectorProps {
  eventId: string;
  eventTitle: string;
  ticketTypes: TicketType[];
}

export function TicketSelector({ eventId, eventTitle, ticketTypes }: TicketSelectorProps) {
  const router = useRouter();
  const { setIntent } = useBookingStore();
  const { isAuthenticated } = useAuthStore();

  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t.id, 0]))
  );

  const now = new Date();

  function available(tt: TicketType) {
    return tt.totalQuantity - tt.quantitySold;
  }

  function isSalesOpen(tt: TicketType) {
    return now >= new Date(tt.salesStart) && now <= new Date(tt.salesEnd);
  }

  function setQty(id: string, value: number) {
    const tt = ticketTypes.find((t) => t.id === id)!;
    const max = available(tt);
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, Math.min(value, max)) }));
  }

  const total = ticketTypes.reduce(
    (sum, tt) => sum + Number(tt.price) * (quantities[tt.id] ?? 0),
    0
  );

  const hasSelection = Object.values(quantities).some((q) => q > 0);

  function handleBookNow() {
    if (!isAuthenticated()) {
      router.push(`/login?returnUrl=/events/${eventId}`);
      return;
    }

    const items = ticketTypes
      .filter((tt) => (quantities[tt.id] ?? 0) > 0)
      .map((tt) => ({
        ticketTypeId: tt.id,
        ticketTypeName: tt.name,
        quantity: quantities[tt.id],
        unitPrice: Number(tt.price),
      }));

    setIntent({ eventId, eventTitle, items });
    router.push("/checkout");
  }

  if (ticketTypes.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-sm text-muted-foreground text-center">
        No tickets available for this event.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h2 className="font-semibold text-base">Tickets</h2>

      {ticketTypes.map((tt) => {
        const avail = available(tt);
        const open = isSalesOpen(tt);
        const soldOut = avail === 0;
        const qty = quantities[tt.id] ?? 0;

        return (
          <div key={tt.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tt.name}</p>
              <p className="text-sm text-muted-foreground">${Number(tt.price).toFixed(2)}</p>
              {soldOut && <p className="text-xs text-destructive">Sold out</p>}
              {!soldOut && !open && <p className="text-xs text-muted-foreground">Sales closed</p>}
              {!soldOut && open && (
                <p className="text-xs text-muted-foreground">{avail} remaining</p>
              )}
            </div>

            {/* Quantity stepper */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(tt.id, qty - 1)}
                disabled={qty === 0 || soldOut || !open}
                className="w-7 h-7 rounded border text-sm font-bold hover:bg-accent disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty(tt.id, qty + 1)}
                disabled={qty >= avail || soldOut || !open}
                className="w-7 h-7 rounded border text-sm font-bold hover:bg-accent disabled:opacity-30"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      {/* Total + CTA */}
      {hasSelection && (
        <div className="pt-2 flex items-center justify-between">
          <p className="text-sm font-medium">Total: ${total.toFixed(2)}</p>
        </div>
      )}

      <button
        onClick={handleBookNow}
        disabled={!hasSelection}
        className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
      >
        {hasSelection ? "Book Now" : "Select tickets to continue"}
      </button>
    </div>
  );
}
