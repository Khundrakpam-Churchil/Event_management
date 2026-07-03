import { Suspense } from "react";
import { EventGrid, EventGridSkeleton } from "@/src/components/events/EventGrid";
import { EventFilters } from "@/src/components/events/EventFilters";
import { ErrorBoundary } from "@/src/components/layout/ErrorBoundary";

interface SearchParams {
  q?: string;
  category?: string;
  city?: string;
  startDate?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

async function fetchEvents(params: SearchParams) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.city) query.set("city", params.city);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.sort) query.set("sort", params.sort);
  query.set("page", params.page ?? "1");
  query.set("limit", params.limit ?? "12");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/events?${query.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error("Failed to load events.");
  return res.json();
}

async function fetchCategories() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/v1/categories`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { data: [] };
  return res.json();
}

interface HomePageProps {
  searchParams: Promise<SearchParams>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const [eventsRes, categoriesRes] = await Promise.allSettled([
    fetchEvents(params),
    fetchCategories(),
  ]);

  const events = eventsRes.status === "fulfilled" ? eventsRes.value.data ?? [] : [];
  const meta = eventsRes.status === "fulfilled" ? eventsRes.value.meta : null;
  const categories = categoriesRes.status === "fulfilled" ? categoriesRes.value.data ?? [] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <p className="text-muted-foreground mt-1">Discover and book tickets for events near you.</p>
      </div>

      <Suspense>
        <EventFilters categories={categories} />
      </Suspense>

      <ErrorBoundary>
        <Suspense fallback={<EventGridSkeleton />}>
          <EventGrid
            events={events}
            page={page}
            totalPages={meta?.totalPages ?? 1}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
