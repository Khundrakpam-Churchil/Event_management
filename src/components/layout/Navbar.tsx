"use client";

import Link from "next/link";
import { useAuthStore } from "@/src/lib/stores/auth.store";
import { apiClient } from "@/src/lib/api/client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore — client clears auth regardless
    }
    clearAuth();
    router.push("/");
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl tracking-tight">
          TicketHub
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>

          {isAuthenticated() && user && (
            <>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                My Tickets
              </Link>

              {(user.role === "ORGANIZER" || user.role === "ADMIN") && (
                <Link
                  href="/organizer/events"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Events
                </Link>
              )}

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </>
          )}

          {!isAuthenticated() && (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm hover:bg-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
