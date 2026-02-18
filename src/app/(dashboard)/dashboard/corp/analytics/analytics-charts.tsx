"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsChartsProps {
  monthlySpend: Array<{ month: string; amount: number; bookings: number }>;
  spendByDepartment: Array<{ department: string; amount: number }>;
  topRoutes: Array<{ route: string; count: number; avgAmount: number }>;
  channelCounts: Record<string, number>;
  complianceTrend: Array<{ month: string; rate: number }>;
}

const DEPT_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"];

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

export function AnalyticsCharts({
  monthlySpend,
  spendByDepartment,
  topRoutes,
  channelCounts,
  complianceTrend,
}: AnalyticsChartsProps) {
  const pieData = Object.entries(channelCounts).map(([key, value]) => ({
    name: CHANNEL_LABELS[key] ?? key,
    value,
    color: CHANNEL_COLORS[key] ?? "#94A3B8",
  }));

  const deptPieData = spendByDepartment.slice(0, 8).map((d, i) => ({
    name: d.department,
    value: d.amount,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const maxRouteCount = topRoutes.length > 0 ? topRoutes[0].count : 1;

  return (
    <div className="space-y-4">
      {/* Row 1: Monthly Spend + Compliance Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Spend (12 months)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlySpend} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={formatINRShort} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`₹${Math.round(Number(value)).toLocaleString("en-IN")}`, "Spend"]}
                contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="amount" fill="#2563EB" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Policy Compliance Trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={complianceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}%`, "Compliance"]}
                contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Department Spend + Channel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Spend by Department">
          {deptPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deptPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {deptPieData.map((entry, index) => (
                      <Cell key={`dept-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`₹${Math.round(Number(value)).toLocaleString("en-IN")}`, "Spend"]}
                    contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {deptPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-600">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Bookings by Channel">
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`ch-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-600">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* Row 3: Top Routes */}
      <ChartCard title="Top Routes (Top 10)">
        {topRoutes.length > 0 ? (
          <div className="space-y-2.5">
            {topRoutes.map((route) => {
              const pct = (route.count / maxRouteCount) * 100;
              return (
                <div key={route.route} className="flex items-center gap-4">
                  <span className="w-24 shrink-0 text-sm font-medium text-[#0F1B2D]">{route.route}</span>
                  <div className="flex-1">
                    <div className="h-5 w-full rounded bg-gray-100">
                      <div
                        className="flex h-5 items-center rounded bg-blue-100 px-2 text-[11px] font-medium text-blue-700 transition-all"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        {route.count}
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
          <EmptyChart />
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#0F1B2D]">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-gray-400">
      No data yet
    </div>
  );
}
