import Link from "next/link";
import { ArrowRight, CalendarDays, Clapperboard, Mic2, Sparkles, Ticket, Users, type LucideIcon } from "lucide-react";

interface ShowcaseItem {
  title: string;
  category: string;
  description: string;
  accent: string;
  badge: string;
  icon: LucideIcon;
  lineOne: string;
  lineTwo: string;
  lineThree: string;
}

const showcaseItems: ShowcaseItem[] = [
  {
    title: "Movie Booking",
    category: "Cinema",
    description: "A premium ticket experience with a cinematic feel and instant seat selection.",
    accent: "from-fuchsia-500/30 via-violet-500/20 to-slate-950",
    badge: "Now Showing",
    icon: Clapperboard,
    lineOne: "Midnight Premiere",
    lineTwo: "Seat A12 • 8:30 PM",
    lineThree: "2 tickets reserved",
  },
  {
    title: "Comedy Show",
    category: "Live Laughs",
    description: "Warm lighting and a playful layout that makes booking feel effortless.",
    accent: "from-amber-500/30 via-orange-500/20 to-slate-950",
    badge: "Trending",
    icon: Mic2,
    lineOne: "Stand-Up Night",
    lineTwo: "Front Row • 9:00 PM",
    lineThree: "4 seats left",
  },
  {
    title: "Concert",
    category: "Soundscape",
    description: "Bold visuals and vibrant energy for high-impact event discovery.",
    accent: "from-cyan-500/30 via-sky-500/20 to-slate-950",
    badge: "Hot Ticket",
    icon: Sparkles,
    lineOne: "Neon Pulse Tour",
    lineTwo: "VIP Lounge • 7:45 PM",
    lineThree: "Early entry included",
  },
  {
    title: "Meet & Greet",
    category: "Fan Access",
    description: "An intimate booking flow that highlights exclusivity and fan moments.",
    accent: "from-emerald-500/30 via-teal-500/20 to-slate-950",
    badge: "Limited",
    icon: Users,
    lineOne: "Backstage Access",
    lineTwo: "Meet & Photo • 6:30 PM",
    lineThree: "Personalized passes",
  },
  {
    title: "Sports Night",
    category: "Arena Action",
    description: "A fast-paced experience built for live matches, team energy, and last-minute seat upgrades.",
    accent: "from-rose-500/30 via-orange-500/20 to-slate-950",
    badge: "Coming Soon",
    icon: Users,
    lineOne: "City Cup Finals",
    lineTwo: "North Arena • 7:00 PM",
    lineThree: "Locker room access",
  },
  {
    title: "Food Festival",
    category: "Culinary",
    description: "Bright, social layouts that make tasting events feel easy to browse and book.",
    accent: "from-lime-500/30 via-emerald-500/20 to-slate-950",
    badge: "Fresh Picks",
    icon: Sparkles,
    lineOne: "Street Flavors Fest",
    lineTwo: "Harbor Square • 5:30 PM",
    lineThree: "VIP tasting lounge",
  },
  {
    title: "Tech Summit",
    category: "Innovation",
    description: "A polished experience for conferences, workshops, and speaker sessions with premium seating options.",
    accent: "from-sky-500/30 via-blue-500/20 to-slate-950",
    badge: "Early Access",
    icon: Clapperboard,
    lineOne: "AI Builders Summit",
    lineTwo: "Hall A • 10:00 AM",
    lineThree: "Workshop seats open",
  },
  {
    title: "Art Expo",
    category: "Culture",
    description: "An elegant booking flow designed for exhibitions, gallery nights, and immersive showcases.",
    accent: "from-violet-500/30 via-purple-500/20 to-slate-950",
    badge: "Featured",
    icon: Mic2,
    lineOne: "Neon Gallery Night",
    lineTwo: "River House • 6:00 PM",
    lineThree: "Limited preview entry",
  },
];

export function UiDesignShowcase() {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200 backdrop-blur">
            <Ticket className="h-4 w-4" />
            UI design examples
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Booking experiences tailored for every kind of event.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Explore modern ticket layouts for movies, comedy nights, concerts, and meet-and-greet sessions with animated transitions and a polished interface.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
          <CalendarDays className="h-4 w-4" />
          Freshly styled booking flows
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {showcaseItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 animate-fade-in-up"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-300">{item.category}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
                  </div>
                  <span className="rounded-full border border-white/20 bg-slate-950/50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-100">
                    {item.badge}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">{item.description}</p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/10 p-2 text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.lineOne}</p>
                        <p className="text-xs text-slate-400">{item.lineTwo}</p>
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                      Live
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400" />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                    <span>{item.lineThree}</span>
                    <Link
                      href="/book-now"
                      className="flex items-center gap-1 font-medium text-white transition-transform duration-300 group-hover:translate-x-1"
                    >
                      Book now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
