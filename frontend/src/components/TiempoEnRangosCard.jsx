// src/components/TiempoEnRangosCard.jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import "../layout/TiempoEnRangosCard.css"
import"../layout/Tarjetas.css"
const formatMinutes = (min) => {
  if (!min || min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};

// convierte % a minutos en un día de 24h
const minutesFromPercent24h = (percent) => (percent / 100) * 24 * 60;

export function TiempoEnRangosCard({ tir }) {
  // porcentajes
  const tirVeryHigh = tir?.very_high?.percent ?? 0;
  const tirHigh     = tir?.high?.percent ?? 0;
  const tirTarget   = tir?.target?.percent ?? 0;
  const tirLow      = tir?.low?.percent ?? 0;
  const tirVeryLow  = tir?.very_low?.percent ?? 0;
  // minutos crudos (por si los quieres usar después)
  const minVeryHigh = tir?.very_high?.minutes ?? 0;
  const minHigh     = tir?.high?.minutes ?? 0;
  const minTarget   = tir?.target?.minutes ?? 0;
  const minLow      = tir?.low?.minutes ?? 0;
  const minVeryLow  = tir?.very_low?.minutes ?? 0;

  const tirChartData = [
    {
      name: "TIR",
      veryHigh: tirVeryHigh,
      high: tirHigh,
      target: tirTarget,
      low: tirLow,
      veryLow: tirVeryLow,
    },
  ];

  const tirSegments = [
    {
      key: "veryHigh",
      label: "Muy alto",
      range: "> 250 mg/dL",
      percent: tirVeryHigh,
      minutesTotal: minVeryHigh,
      color: "#D97706",
    },
    {
      key: "high",
      label: "Alto",
      range: "181–250 mg/dL",
      percent: tirHigh,
      minutesTotal: minHigh,
      color: "#FBBF24",
    },
    {
      key: "target",
      label: "Dentro del intervalo",
      range: "70–180 mg/dL",
      percent: tirTarget,
      minutesTotal: minTarget,
      color: "#16A34A",
    },
    {
      key: "low",
      label: "Bajo",
      range: "54–69 mg/dL",
      percent: tirLow,
      minutesTotal: minLow,
      color: "#F97316",
    },
    {
      key: "veryLow",
      label: "Muy bajo",
      range: "< 54 mg/dL",
      percent: tirVeryLow,
      minutesTotal: minVeryLow,
      color: "#B91C1C",
    },
  ];

  return (
    <div className="subcard" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>Tiempo en rangos</h2>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="card-subtitle">Objetivos para la diabetes tipo I</p>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginTop: "20px",
          flex: 1
        }}
      >
        {/* Barra vertical apilada */}
        <div style={{ width: 40, height: 200, borderRadius: '8px', overflow: 'hidden' }}>
          <BarChart
            width={40}
            height={200}
            data={tirChartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={40}
          >
            <XAxis dataKey="name" hide />
            <YAxis type="number" domain={[0, 100]} hide />

            <Bar dataKey="veryLow"  stackId="tir" fill="#e11d48" />
            <Bar dataKey="low"      stackId="tir" fill="#facc15" />
            <Bar dataKey="target"   stackId="tir" fill="#22c55e" />
            <Bar dataKey="high"     stackId="tir" fill="#fbbf24" />
            <Bar dataKey="veryHigh" stackId="tir" fill="#d97706" />
          </BarChart>
        </div>

        {/* Leyenda alineada en columnas */}
        <div className="tir-legend" style={{ flex: 1, gap: '12px' }}>
          {tirSegments.map((seg) => {
            const minutes24h = minutesFromPercent24h(seg.percent);

            return (
              <div className="tir-legend-row" key={seg.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="tir-legend-main" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span
                    className="tir-legend-color"
                    style={{ backgroundColor: seg.color, borderRadius: '50%', width: '10px', height: '10px', marginTop: '4px' }}
                  />
                  <div className="tir-legend-textblock">
                    <div className="tir-legend-label-main" style={{ fontSize: '13px', color: '#111827' }}>{seg.label}</div>
                    <div className="tir-legend-range">{seg.range}</div>
                  </div>
                </div>

                <div className="tir-legend-right" style={{ textAlign: 'right' }}>
                  <span className="tir-legend-percent" style={{ fontSize: '13px', color: '#111827' }}>
                    {seg.percent.toFixed(1)}%
                  </span>
                  <span className="tir-legend-time">
                    {formatMinutes(minutes24h)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '16px', 
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#111827' }}>TIR (70-180 mg/dL)</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Objetivo: &gt; 70%</p>
        </div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '18px', color: '#22c55e' }}>{tirTarget.toFixed(1)}%</p>
      </div>
    </div>
  );
}
