"use client";

import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { label: "Users",      href: "/admin" },
  { label: "Venues",     href: "/admin/venues" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Events",     href: "/admin/events" },
  { label: "Bookings",   href: "/admin/bookings" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="flex gap-1 border-b mb-6">
      {TABS.map((tab) => {
        const active = tab.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(tab.href);
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
