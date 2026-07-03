import Link from "next/link";
import Image from "next/image";

interface TicketType {
  id: string;
  price: number;
  totalQuantity: number;
  quantitySold: number;
}

interface Venue {
  name: string;
  city: string;
}

interface Category {
  name: string;
}

export interface EventCardProps {
  id: string;
  title: string;
  startDateTime: string;
  bannerImageUrl?: string | null;
  venue: Venue;
  category: Category;
  ticketTypes: TicketType[];
}

function lowestPrice(ticketTypes: TicketType[]): number | null {
  if (!ticketTypes.length) return null;
  return Math.min(...ticketTypes.map((t) => Number(t.price)));
}

function isSoldOut(ticketTypes: TicketType[]): boolean {
  if (!ticketTypes.length) return false;
  return ticketTypes.every((t) => t.quantitySold >= t.totalQuantity);
}

export function EventCard({ id, title, startDateTime, bannerImageUrl, venue, category, ticketTypes }: EventCardProps) {
  const price = lowestPrice(ticketTypes);
  const soldOut = isSoldOut(ticketTypes);

  return (
    <Link href={`/events/${id}`} className="group block rounded-xl border border-border/50 bg-card overflow-hidden hover-card-up shadow-sm">
      {/* Banner */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {bannerImageUrl ? (
          <Image
            src={bannerImageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Category badge */}
        <span className="absolute top-2 left-2 text-xs font-medium bg-background/90 px-2 py-0.5 rounded-full">
          {category.name}
        </span>

        {soldOut && (
          <span className="absolute top-2 right-2 text-xs font-medium bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
            Sold Out
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {new Date(startDateTime).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {venue.name} · {venue.city}
        </p>
        {price !== null && (
          <p className="text-sm font-medium pt-1">
            {soldOut ? (
              <span className="text-muted-foreground">Sold Out</span>
            ) : (
              <>From <span className="text-foreground">${price.toFixed(2)}</span></>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
