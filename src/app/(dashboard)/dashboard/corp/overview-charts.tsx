"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MonthlySpend {
  month: string;
  amount: number;
  bookings: number;
}

interface TopRoute {
  route: string;
  count: number;
  avgAmount: number;
}

interface OverviewChartsProps {
  monthlySpend: MonthlySpend[];
  channelCounts: Record<string, number>;
  topRoutes: TopRoute[];
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  web: "#2563EB",
  admin_booked: "#8B5CF6",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  web: "Web",
  admin_booked: "Admin",
};

function formatINRShort(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

export function OverviewCharts({ monthlySpend, channelCounts, topRoutes }: OverviewChartsProps) {
  const pieData = Object.entries(channelCounts).map(([key, value]) => ({
    name: CHANNEL_LABELS[key] ?? key,
    value,
    color: CHANNEL_COLORS[key] ?? "#94A3B8",
  }));

  const maxRouteCount = topRoutes.length > 0 ? topRoutes[0].count : 1;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Monthly Spend Bar Chart */}
      <div className="col-span-1 rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-[#0F1B2D]">Monthly Spend</h3>
        {monthlySpend.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlySpend} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatINRShort}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`₹${Math.round(Number(value)).toLocaleString("en-IN")}`, "Spend"]}
                contentStyle={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-60 items-center justify-center text-sm text-gray-400">
            No spend data yet
          </div>
        )}
      </div>

      {/* Channel Pie Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-[#0F1B2D]">Bookings by Channel</h3>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-600">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-60 items-center justify-center text-sm text-gray-400">
            No channel data yet
          </div>
        )}
      </div>

      {/* Top Routes */}
      <div className="col-span-1 rounded-lg border border-gray-200 bg-white p-4 lg:col-span-3">
        <h3 className="mb-4 text-sm font-semibold text-[#0F1B2D]">Top Routes</h3>
        {topRoutes.length > 0 ? (
          <div className="space-y-3">
            {topRoutes.map((route) => {
              const pct = (route.count / maxRouteCount) * 100;
              return (
                <div key={route.route} className="flex items-center gap-4">
                  <span className="w-24 shrink-0 text-sm font-medium text-[#0F1B2D]">
                    {route.route}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 w-full rounded bg-gray-100">
                      <div
                        className="flex h-6 items-center rounded bg-blue-100 px-2 text-xs font-medium text-blue-700 transition-all"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        {route.count} bookings
                      </div>
                    </div>
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-gray-500">
                    ~₹{Math.round(route.avgAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            No route data yet
          </div>
        )}
      </div>
    </div>
  );
}
