"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/src/lib/api/client";

interface Attendee {
  ticketCode: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  bookingItem: {
    ticketType: { name: string };
    booking: { userId: string };
  };
  userName?: string;
  userEmail?: string;
}

interface AttendeeTableProps {
  initialAttendees: Attendee[];
}

export function AttendeeTable({ initialAttendees }: AttendeeTableProps) {
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleCheckIn(code: string) {
    setErrors((prev) => ({ ...prev, [code]: "" }));
    try {
      await apiClient.post(`/tickets/${code}/checkin`);
      setAttendees((prev) =>
        prev.map((a) =>
          a.ticketCode === code
            ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Check-in failed.";
      setErrors((prev) => ({ ...prev, [code]: msg }));
    }
  }

  if (attendees.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No attendees yet.</p>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Ticket Code</th>
            <th className="text-left px-4 py-2 font-medium">Ticket Type</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            <th className="text-right px-4 py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {attendees.map((attendee) => (
            <tr key={attendee.ticketCode} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-mono text-xs">{attendee.ticketCode}</td>
              <td className="px-4 py-3">{attendee.bookingItem.ticketType.name}</td>
              <td className="px-4 py-3">
                {attendee.checkedIn ? (
                  <span className="text-xs text-green-700 font-medium">✓ Checked in</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not checked in</span>
                )}
                {errors[attendee.ticketCode] && (
                  <p className="text-xs text-destructive mt-0.5">{errors[attendee.ticketCode]}</p>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {!attendee.checkedIn && (
                  <button
                    onClick={() => handleCheckIn(attendee.ticketCode)}
                    className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                  >
                    Check In
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
