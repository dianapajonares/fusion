import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

export function HbA1cChart({ data, targetValue = 7.0 }) {
  if (!data || data.length === 0) {
    return <p className="chart-empty">Sin datos de HbA1c</p>;
  }

  return (
    <div style={{ width: "95%", height: 160 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#E5E7EB"
          />

          <XAxis dataKey="timestamp" hide />

          <YAxis hide domain={["auto", "auto"]} />

          <Tooltip
            cursor={{ stroke: "#0A2A66", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              padding: "8px 10px",
              fontSize: 12,
            }}
            formatter={(value) => [`${value.toFixed(1)} %`, "HbA1c"]}
            labelFormatter={(label) => `Fecha: ${label}`}
          />

          <defs>
            <linearGradient id="hba1cFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B3C74" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1B3C74" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <ReferenceLine 
            y={targetValue} 
            stroke="#3b82f6" 
            strokeDasharray="4 4" 
            ifOverflow="extendDomain"
            label={{ position: 'insideTopLeft', value: `Meta: ${targetValue}%`, fill: '#3b82f6', fontSize: 12, fontWeight: 500 }} 
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#0A2A66"
            strokeWidth={3}
            fill="url(#hba1cFill)"
            dot={{ r: 5, fill: '#FFFFFF', strokeWidth: 3, stroke: '#0A2A66' }}
            activeDot={{ r: 8, fill: '#0A2A66', strokeWidth: 2, stroke: '#FFFFFF' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
