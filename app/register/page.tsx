"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterInputSchema, type RegisterInput } from "@/src/lib/schemas/auth.schema";
import { apiClient } from "@/src/lib/api/client";
import { useAuthStore } from "@/src/lib/stores/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterInputSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      const res = await apiClient.post<{ token: string; user: { id: string; name: string; email: string; role: "USER" | "ORGANIZER" | "ADMIN" } }>(
        "/auth/register",
        data
      );
      setAuth(res.data.user, res.data.token);
      document.cookie = `auth-token=${res.data.token}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-foreground">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
