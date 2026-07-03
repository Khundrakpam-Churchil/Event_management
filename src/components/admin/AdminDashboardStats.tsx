import { Users, Calendar, Ticket, DollarSign } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
}

interface AdminDashboardStatsProps {
  stats: AdminStats;
}

export function AdminDashboardStats({ stats }: AdminDashboardStatsProps) {
  const items = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Ticket,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, idx) => (
        <div key={idx} className="glass rounded-xl p-6 flex items-center gap-4 hover-card-up">
          <div className={`p-4 rounded-full ${item.bgColor} ${item.color}`}>
            <item.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
            <h3 className="text-2xl font-bold">{item.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
