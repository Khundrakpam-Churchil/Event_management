import { cookies } from "next/headers";
import Link from "next/link";
import { EventTable } from "@/src/components/organizer/EventTable";

async function fetchOrganizerEvents(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/events?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default async function OrganizerEventsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">My Events</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          You need to be signed in as an Organizer to manage your events.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link href="/login?returnUrl=/organizer/events" className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
            Sign In
          </Link>
          <Link href="/" className="px-6 py-2 border rounded-md font-medium hover:bg-muted transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const events = await fetchOrganizerEvents(token);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <EventTable initialEvents={events} />
    </div>
  );
}
