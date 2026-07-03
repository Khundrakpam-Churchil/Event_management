interface Booking {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  event?: { title: string };
  user?: { name: string; email: string };
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export function BookingsPanel({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-2 font-medium">ID</th>
            <th className="text-left px-4 py-2 font-medium">Event</th>
            <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">User</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            <th className="text-right px-4 py-2 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-mono text-xs">{b.id.slice(-8).toUpperCase()}</td>
              <td className="px-4 py-3 truncate max-w-[160px]">{b.event?.title ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{b.user?.email ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[b.status] ?? ""}`}>{b.status}</span>
              </td>
              <td className="px-4 py-3 text-right">${Number(b.totalAmount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
