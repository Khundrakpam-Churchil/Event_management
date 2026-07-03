import { notFound } from "next/navigation";
import { EventDetail } from "@/src/components/events/EventDetail";
import { TicketSelector } from "@/src/components/events/TicketSelector";
import { ErrorBoundary } from "@/src/components/layout/ErrorBoundary";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchEvent(id: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/events/${id}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load event.");
  const json = await res.json();
  return json.data;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await fetchEvent(id);

  if (!event) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: event info */}
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <EventDetail
              title={event.title}
              description={event.description}
              bannerImageUrl={event.bannerImageUrl}
              startDateTime={event.startDateTime}
              endDateTime={event.endDateTime}
              venue={event.venue}
              category={event.category}
              organizer={event.organizer}
            />
          </ErrorBoundary>
        </div>

        {/* Right: ticket selector */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ErrorBoundary>
              <TicketSelector
                eventId={event.id}
                eventTitle={event.title}
                ticketTypes={event.ticketTypes ?? []}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
