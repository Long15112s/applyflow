"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ApplicationsOverTimeChart({ data }: { data: Array<{ key: string; label: string; count: number }> }) {
  return <div className="analytics-chart" aria-label="Applications created during the last six months">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid stroke="#e5e5df" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b6b66", fontSize: 12 }} />
        <YAxis allowDecimals={false} domain={[0, (maximum: number) => Math.max(1, maximum)]} tickCount={3} axisLine={false} tickLine={false} tick={{ fill: "#6b6b66", fontSize: 12 }} />
        <Tooltip cursor={{ fill: "#f5f5f2" }} contentStyle={{ border: "1px solid #e5e5df", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.08)" }} />
        <Bar dataKey="count" name="Applications" fill="#171717" radius={[8, 8, 2, 2]} maxBarSize={54} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
