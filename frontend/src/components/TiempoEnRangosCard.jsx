// src/components/TiempoEnRangosCard.jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

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
    <div className="subcard">
      <h2 className="card-title">Tiempo en rangos</h2>
      <p className="card-subtitle">Objetivos para la diabetes tipo I</p>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {/* Barra vertical apilada */}
        <div style={{ width: 70, height: 200 }}>
          <BarChart
            width={60}
            height={200}
            data={tirChartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={60}
          >
            <XAxis dataKey="name" hide />
            <YAxis type="number" domain={[0, 100]} hide />

            <Bar dataKey="veryLow"  stackId="tir" fill="#B91C1C" />
            <Bar dataKey="low"      stackId="tir" fill="#F97316" />
            <Bar dataKey="target"   stackId="tir" fill="#16A34A" />
            <Bar dataKey="high"     stackId="tir" fill="#FBBF24" />
            <Bar dataKey="veryHigh" stackId="tir" fill="#D97706" />
          </BarChart>
        </div>

        {/* Leyenda alineada en columnas */}
        {/* Leyenda con % y tiempo en columna (más aire) */}
        <div className="tir-legend">
  {tirSegments.map((seg) => {
    const minutes24h = minutesFromPercent24h(seg.percent);

    return (
      <div className="tir-legend-row" key={seg.key}>
        {/* Izquierda: color + texto (label arriba, rango abajo) */}
        <div className="tir-legend-main">
          <span
            className="tir-legend-color"
            style={{ backgroundColor: seg.color }}
          />
          <div className="tir-legend-textblock">
            <div className="tir-legend-label-main">{seg.label}</div>
            <div className="tir-legend-range">({seg.range})</div>
          </div>
        </div>

        {/* Línea punteada intermedia */}
        <div className="tir-legend-dotleader" />

        {/* Derecha: % arriba, tiempo debajo */}
        <div className="tir-legend-right">
          <span className="tir-legend-percent">
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
    </div>
  );
}
