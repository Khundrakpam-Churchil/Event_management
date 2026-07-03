import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookingList } from "@/src/components/dashboard/BookingList";

async function fetchUserBookings(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) redirect("/login?returnUrl=/dashboard");

  const bookings = await fetchUserBookings(token);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Your tickets and booking history.</p>
      </div>
      <BookingList bookings={bookings} />
    </div>
  );
}
