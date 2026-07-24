import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { useState, useMemo } from "react";

export function GlucoseChart({ data, events, filters }) {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [days, setDays] = useState(14);

  if (!data?.length) return <p>No hay datos</p>;

 

  const mergeEvents = (events, gapMinutes = 5) => {
    if (!events?.length) return [];

    const sorted = [...events].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );

    const merged = [];
    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const currentEnd = new Date(current.end).getTime();
      const nextStart = new Date(next.start).getTime();
      const gap = (nextStart - currentEnd) / 60000;

      if (current.type === next.type && gap <= gapMinutes) {
        current.end = new Date(
          Math.max(currentEnd, new Date(next.end).getTime())
        ).toISOString();
      } else {
        merged.push(current);
        current = { ...next };
      }
    }

    merged.push(current);
    return merged;
  };

  const formatType = (type) => {
    if (type === "hipo_severa") return "Hipoglucemia severa";
    if (type === "hipo") return "Hipoglucemia";
    if (type === "hiper_severa") return "Hiperglucemia severa";
    if (type === "hiper") return "Hiperglucemia";
    return "Evento";
  };

  const getColor = (type) => {
    if (type.includes("hipo")) return "#ef4444";
    if (type.includes("hiper")) return "#f97316";
    return "#6b7280";
  };



  const processedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      timestamp: new Date(d.timestamp).getTime(),
    }));
  }, [data]);

  // resolución adaptativa (CLAVE)
  const windowSize = days > 10 ? 15 : days > 5 ? 10 : 5;

  const averageByWindow = (data, windowMin) => {
    const buckets = {};
    data.forEach((d) => {
      const key = Math.floor(d.timestamp / (windowMin * 60000));
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(d.value);
    });

    return Object.entries(buckets).map(([k, values]) => ({
      timestamp: k * windowMin * 60000,
      value: values.reduce((a, b) => a + b, 0) / values.length,
    }));
  };

  const movingAverage = (data, window = 2) => {
    return data.map((d, i, arr) => {
      const slice = arr.slice(Math.max(0, i - window), i + 1);
      const avg =
        slice.reduce((sum, v) => sum + v.value, 0) / slice.length;
      return { ...d, value: avg };
    });
  };

  const cleanData = useMemo(() => {
    return movingAverage(
      averageByWindow(processedData, windowSize),
      2
    );
  }, [processedData, windowSize]);

  // rango visible
  const visibleData = useMemo(() => {
    const end = cleanData[cleanData.length - 1].timestamp;
    const start = end - days * 24 * 60 * 60 * 1000;

    return cleanData.filter(
      (d) => d.timestamp >= start && d.timestamp <= end
    );
  }, [cleanData, days]);

  // eventos filtrados SOLO en rango visible
  const filteredEvents = useMemo(() => {
    const merged = mergeEvents(
      events?.filter((e) => (filters ? filters[e.type] : true)),
      5
    );

    return merged.filter((e) => {
      const start = new Date(e.start).getTime();
      const end = new Date(e.end).getTime();
      return (
        start <= visibleData[visibleData.length - 1]?.timestamp &&
        end >= visibleData[0]?.timestamp
      );
    });
  }, [events, filters, visibleData]);

  const findEventAtTime = (timestamp) => {
    return filteredEvents.find((e) => {
      const start = new Date(e.start).getTime();
      const end = new Date(e.end).getTime();
      return timestamp >= start && timestamp <= end;
    });
  };

  // =========================
  // 🔹 RENDER
  // =========================

  return (
    <div style={{ width: "100%" }}>
      
      {/* 🔹 SLIDER */}
      <div style={{ marginBottom: 16, padding: "0 12px" }}>
        <div style={{ fontSize: 12, marginBottom: 8, color: "#6b7280" }}>
          Mostrar últimos <strong>{days}</strong> días
        </div>

        <input
          type="range"
          min={1}
          max={14}
          step={1}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ width: "100%", cursor: "pointer" }}
        />
      </div>

      {/* GRÁFICA */}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={visibleData}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="2 6" />

          {/* separadores de día */}
          {visibleData.map((d, i) => {
            if (i === 0) return null;
            const curr = new Date(d.timestamp).toDateString();
            const prev = new Date(
              visibleData[i - 1].timestamp
            ).toDateString();

            if (curr !== prev) {
              return (
                <ReferenceLine
                  key={i}
                  x={d.timestamp}
                  stroke="#cbd5f5"
                  strokeDasharray="3 3"
                />
              );
            }
            return null;
          })}

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t, i) => {
              if (days > 10 && i % 2 !== 0) return "";
              return new Date(t).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
              });
            }}
            tick={{ fontSize: 11 }}
          />

          <YAxis domain={[50, 300]} />

          <Tooltip
            labelFormatter={(label) => {
              const ev = findEventAtTime(label);
              const fecha = new Date(label).toLocaleString("es-MX");

              if (!ev) return fecha;

              const durMin =
                (new Date(ev.end) - new Date(ev.start)) / 60000;

              const dur =
                durMin >= 60
                  ? `${(durMin / 60).toFixed(1)} h`
                  : `${Math.round(durMin)} min`;

              return `${fecha} | ${formatType(ev.type)} (${dur})`;
            }}
            formatter={(value) => [
              `${Number(value).toFixed(2)} mg/dL`,
              "Glucosa",
            ]}
          />

          <ReferenceArea y1={70} y2={180} fill="#22c55e" fillOpacity={0.08} />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" />
          <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="4 4" />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#1e3a8a"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 🔹 TIMELINE */}
      <div
        style={{
          marginTop: 12,
          position: "relative",
          height: 34,
          background: "#f3f4f6",
          borderRadius: 6,
        }}
      >
        {filteredEvents.map((e, i) => {
          const start = visibleData[0].timestamp;
          const end =
            visibleData[visibleData.length - 1].timestamp;

          const left =
            ((new Date(e.start).getTime() - start) / (end - start)) *
            100;

          let width =
            ((new Date(e.end).getTime() -
              new Date(e.start).getTime()) /
              (end - start)) *
            100;

          width = Math.max(width, 1); // 🔥 visibilidad

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredEvent(e)}
              onMouseLeave={() => setHoveredEvent(null)}
              style={{
                position: "absolute",
                left: `${left}%`,
                width: `${width}%`,
                height: "100%",
                background: getColor(e.type),
                borderRadius: 4,
                opacity: 0.85,
              }}
            />
          );
        })}
      </div>

      {/* 🔹 INFO */}
      <div style={{ marginTop: 10 }}>
        {hoveredEvent ? (
          <>
            <strong>{formatType(hoveredEvent.type)}</strong>{" "}
            {new Date(hoveredEvent.start).toLocaleDateString("es-MX")}{" "}
            {new Date(hoveredEvent.start).toLocaleTimeString("es-MX")} –{" "}
            {new Date(hoveredEvent.end).toLocaleTimeString("es-MX")}
          </>
        ) : (
          <span>Pase el cursor sobre un evento</span>
        )}
      </div>
    </div>
  );
}