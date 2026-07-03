import Link from "next/link";
import { EventCard, type EventCardProps } from "./EventCard";

interface EventGridProps {
  events: EventCardProps[];
  page: number;
  totalPages: number;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

export function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function EventGrid({ events, page, totalPages }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No events found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
