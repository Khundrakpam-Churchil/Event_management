"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">{error.message ?? "An unexpected error occurred."}</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
