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
        <div className="px-5 py-6 space-y-8 bg-muted/30">
          {booking.bookingItems.map((item) => (
            <div key={item.id} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                {item.ticketType.name} <span className="badge">{item.quantity}x</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="relative flex overflow-hidden rounded-xl bg-card shadow-sm border border-border/50 hover-card-up"
                  >
                    {/* Ticket Stub (Left) */}
                    <div className="flex flex-col items-center justify-center p-4 bg-primary/5 border-r border-dashed border-border/60 relative">
                      {/* Semi-circle cutouts for realistic ticket look */}
                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-muted/30 rounded-full border border-border/50"></div>
                      <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-muted/30 rounded-full border border-border/50"></div>
                      
                      <QRCodeSVG
                        value={ticket.ticketCode}
                        size={80}
                        className="rounded-lg shadow-sm bg-white p-1 mb-2"
                      />
                      <p className="text-[10px] font-mono text-muted-foreground break-all text-center uppercase">
                        {ticket.ticketCode}
                      </p>
                    </div>

                    {/* Ticket Info (Right) */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-primary font-medium mb-1">
                          {new Date(booking.event.startDateTime).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                          {booking.event.title}
                        </h4>
                      </div>
                      
                      <div className="mt-3 flex items-end justify-between">
                         <div className="text-xs text-muted-foreground">
                            Admit One
                         </div>
                         {ticket.checkedIn ? (
                           <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-md font-medium">
                             ✓ Scanned
                           </span>
                         ) : (
                           <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md font-medium">
                             Valid
                           </span>
                         )}
                      </div>
                    </div>
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
