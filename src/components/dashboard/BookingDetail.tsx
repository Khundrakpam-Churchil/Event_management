"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Booking } from "./BookingList";

interface BookingDetailProps {
  booking: Booking;
  onClose: () => void;
  cancelButton?: React.ReactNode;
}

export function BookingDetail({ booking, onClose, cancelButton }: BookingDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold">{booking.event.title}</h2>
            <p className="text-xs text-muted-foreground">
              Booking #{booking.id.slice(-8).toUpperCase()} · {booking.status}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Booking items + QR codes */}
        <div className="px-5 py-4 space-y-6">
          {booking.bookingItems.map((item) => (
            <div key={item.id}>
              <p className="text-sm font-medium mb-3">
                {item.ticketType.name} × {item.quantity} — ${Number(item.unitPrice).toFixed(2)} each
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {item.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-2 flex flex-col items-center gap-1 text-center"
                  >
                    <QRCodeSVG
                      value={ticket.ticketCode}
                      size={80}
                      className="rounded"
                    />
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {ticket.ticketCode}
                    </p>
                    {ticket.checkedIn && (
                      <span className="text-xs text-green-700 font-medium">✓ Checked in</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex items-center justify-between">
          <p className="text-sm font-semibold">
            Total: ${Number(booking.totalAmount).toFixed(2)}
          </p>
          {cancelButton}
        </div>
      </div>
    </div>
  );
}
