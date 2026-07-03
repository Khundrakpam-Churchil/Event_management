interface Event {
  id: string;
  title: string;
  status: string;
  startDateTime: string;
  organizer?: { name: string };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

export function EventsPanel({ events }: { events: Event[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Title</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Organizer</th>
            <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-medium truncate max-w-[180px]">{e.title}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[e.status] ?? ""}`}>{e.status}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{e.organizer?.name ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                {new Date(e.startDateTime).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
