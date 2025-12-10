import React from "react";

export function CicloBar({ dia, total }) {
  const percent = Math.min((dia / total) * 100, 100);

  return (
    <div style={{ width: "100%", marginTop: "6px" }}>
      <div
        style={{
          height: "10px",
          background: "#e5e7eb",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "linear-gradient(90deg, #93c5fd, #a5b4fc)", 
            transition: "width 0.4s ease",
          }}
        ></div>
      </div>

      <p
        style={{
          fontSize: "12px",
          marginTop: "4px",
          color: "#6b7280",
          textAlign: "right",
        }}
      >
        {dia}/{total}
      </p>
    </div>
  );
}
