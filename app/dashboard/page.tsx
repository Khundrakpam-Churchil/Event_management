import { cookies } from "next/headers";
import Link from "next/link";
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

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">My Tickets</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          You need to be signed in to view your tickets and booking history.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link href="/login?returnUrl=/dashboard" className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
            Sign In
          </Link>
          <Link href="/" className="px-6 py-2 border rounded-md font-medium hover:bg-muted transition-colors">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const bookings = await fetchUserBookings(token);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">My Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your tickets and booking history.</p>
        </div>
        <div className="glass px-4 py-2 rounded-lg flex items-center gap-4">
           <div>
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Bookings</p>
             <p className="text-lg font-bold">{bookings.length}</p>
           </div>
        </div>
      </div>
      
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        <BookingList bookings={bookings} />
      </div>
    </div>
  );
}
