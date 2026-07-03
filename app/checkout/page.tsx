"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/src/lib/stores/booking.store";
import { useAuthStore } from "@/src/lib/stores/auth.store";
import { OrderSummary } from "@/src/components/checkout/OrderSummary";
import { CheckoutForm } from "@/src/components/checkout/CheckoutForm";

export default function CheckoutPage() {
  const router = useRouter();
  const { intent } = useBookingStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login?returnUrl=/checkout");
      return;
    }
    if (!intent) {
      router.replace("/");
    }
  }, [intent, isAuthenticated, router]);

  if (!intent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">Review your order and confirm.</p>
      </div>

      <OrderSummary intent={intent} />
      <CheckoutForm intent={intent} />
    </div>
  );
}
