"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Category {
  id: string;
  name: string;
}

interface EventFiltersProps {
  categories: Category[];
}

export function EventFilters({ categories }: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="search"
        placeholder="Search events…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => updateParam("q", e.target.value)}
        className="border rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Search events"
      />

      {/* Category */}
      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Date from */}
      <input
        type="date"
        defaultValue={searchParams.get("startDate") ?? ""}
        onChange={(e) => updateParam("startDate", e.target.value)}
        className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="From date"
      />

      {/* Sort */}
      <select
        defaultValue={searchParams.get("sort") ?? "startDateTime"}
        onChange={(e) => updateParam("sort", e.target.value)}
        className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Sort events"
      >
        <option value="startDateTime">Date (earliest)</option>
        <option value="-startDateTime">Date (latest)</option>
        <option value="title">Title A–Z</option>
        <option value="-title">Title Z–A</option>
      </select>
    </div>
  );
}
