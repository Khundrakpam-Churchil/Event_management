import { Suspense } from "react";
import { EventGrid, EventGridSkeleton } from "@/src/components/events/EventGrid";
import { EventFilters } from "@/src/components/events/EventFilters";
import { ErrorBoundary } from "@/src/components/layout/ErrorBoundary";
import { UiDesignShowcase } from "@/src/components/layout/UiDesignShowcase";

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
    <div className="space-y-12">
      <section className="relative px-4 pt-20 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            Discover <span className="text-gradient">Unforgettable</span> Events
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            Your gateway to the best concerts, conferences, and community gatherings near you. Secure your tickets in seconds.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          <p className="text-muted-foreground mt-1">Don&apos;t miss out on these popular events.</p>
        </div>

        <UiDesignShowcase />

        <div className="pt-4">
          <h2 className="text-2xl font-semibold">Upcoming Events</h2>
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
    </div>
  );
}
