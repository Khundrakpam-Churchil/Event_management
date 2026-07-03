import type { BookingIntent } from "@/src/lib/stores/booking.store";

interface OrderSummaryProps {
  intent: BookingIntent;
}

export function OrderSummary({ intent }: OrderSummaryProps) {
  const total = intent.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Order Summary</h2>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{intent.eventTitle}</p>
      </div>

      <div className="divide-y">
        {intent.items.map((item) => (
          <div key={item.ticketTypeId} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{item.ticketTypeName}</p>
              <p className="text-xs text-muted-foreground">
                ${item.unitPrice.toFixed(2)} × {item.quantity}
              </p>
            </div>
            <p className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
        <p className="text-sm font-semibold">Total</p>
        <p className="text-base font-bold">${total.toFixed(2)}</p>
      </div>
    </div>
  );
}
