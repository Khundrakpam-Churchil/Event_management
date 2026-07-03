import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { AttendeeTable } from "@/src/components/organizer/AttendeeTable";

async function fetchAttendees(eventId: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Fetch all bookings for this event (Admin/Organizer view)
  const res = await fetch(`${baseUrl}/api/v1/bookings?eventId=${eventId}&limit=500`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 403) return null;
  if (!res.ok) return [];
  const json = await res.json();

  // Flatten to individual tickets
  const bookings: Array<{
    bookingItems: Array<{
      ticketType: { name: string };
      booking: { userId: string };
      tickets: Array<{ ticketCode: string; checkedIn: boolean; checkedInAt: string | null }>;
    }>;
  }> = json.data ?? [];

  return bookings.flatMap((b) =>
    b.bookingItems.flatMap((item) =>
      item.tickets.map((ticket) => ({
        ticketCode: ticket.ticketCode,
        checkedIn: ticket.checkedIn,
        checkedInAt: ticket.checkedInAt,
        bookingItem: {
          ticketType: item.ticketType,
          booking: item.booking,
        },
      }))
    )
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AttendeesPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) redirect(`/login?returnUrl=/organizer/events/${id}/attendees`);

  const attendees = await fetchAttendees(id, token);

  if (attendees === null) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendees</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {attendees.length} ticket(s) issued for this event.
        </p>
      </div>
      <AttendeeTable initialAttendees={attendees} />
    </div>
  );
}
