// src/components/InfoTooltip.jsx
import React from "react";

import "../layout/Tooltip.css"
export function InfoTooltip({ children }) {
  return (
    <span className="tooltip">
      <span className="tooltip-icon">ⓘ</span>
      <span className="tooltip-bubble">
        {children}
      </span>
    </span>
  );
}
