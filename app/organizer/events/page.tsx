import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

  if (!token) redirect("/login?returnUrl=/organizer/events");

  const events = await fetchOrganizerEvents(token);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <EventTable initialEvents={events} />
    </div>
  );
}
