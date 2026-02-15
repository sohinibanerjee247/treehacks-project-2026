"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

type DataPoint = { time: string; yes: number };
type LocalPoint = { label: string; yes: number };

type Props = { data: DataPoint[] };

function parseAsLocalTime(dateStr: string) {
  const hasTimezone =
    /Z$/.test(dateStr) || /[+-]\d{2}:\d{2}$/.test(dateStr) || /[+-]\d{4}$/.test(dateStr);

  const normalized = hasTimezone ? dateStr : `${dateStr}Z`;
  return new Date(normalized);
}

export default function SentimentChart({ data }: Props) {
  const [localData, setLocalData] = useState<LocalPoint[]>([]);

  // Format timestamps only after mount so it uses the browser's timezone
  useEffect(() => {
    setLocalData(
      data.map((d) => {
        const date = parseAsLocalTime(d.time);
        const h = date.getHours();
        const m = date.getMinutes().toString().padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return { label: `${h12}:${m} ${ampm}`, yes: d.yes };
      })
    );
  }, [data]);

  if (localData.length === 0) return null;

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={localData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#71717a" }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#71717a" }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value: number | undefined) => [`${value ?? 0}% YES`, "Sentiment"]}
          />
          <ReferenceLine y={50} stroke="#3f3f46" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="yes"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#yesGradient)"
            dot={false}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
