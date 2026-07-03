import Image from "next/image";

interface Venue {
  name: string;
  address: string;
  city: string;
  capacity: number;
}

interface Category {
  name: string;
}

interface Organizer {
  name: string;
}

export interface EventDetailProps {
  title: string;
  description: string;
  bannerImageUrl?: string | null;
  startDateTime: string;
  endDateTime: string;
  venue: Venue;
  category: Category;
  organizer: Organizer;
}

export function EventDetail({
  title,
  description,
  bannerImageUrl,
  startDateTime,
  endDateTime,
  venue,
  category,
  organizer,
}: EventDetailProps) {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Banner */}
      {bannerImageUrl && (
        <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-muted">
          <Image
            src={bannerImageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
          {category.name}
        </span>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">Organised by {organizer.name}</p>
      </div>

      {/* Date & Venue */}
      <div className="grid sm:grid-cols-2 gap-4 border rounded-lg p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Date & Time</p>
          <p className="text-sm font-medium">{formatDate(start)}</p>
          <p className="text-sm text-muted-foreground">
            {formatTime(start)} – {formatTime(end)}
            {start.toDateString() !== end.toDateString() && ` (${formatDate(end)})`}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Location</p>
          <p className="text-sm font-medium">{venue.name}</p>
          <p className="text-sm text-muted-foreground">
            {venue.address}, {venue.city}
          </p>
          <p className="text-xs text-muted-foreground">Capacity: {venue.capacity.toLocaleString()}</p>
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
        {description}
      </div>
    </div>
  );
}
