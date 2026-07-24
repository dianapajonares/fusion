/*TreatmentCard.jsx */
import React, { useState } from "react";
/*import TreatmentBottomSheet from "./TreatmentBottomSheet";*/
import { InsulinIcon } from "../icons/Icons";
import "../layout/TreatmentCard.css";

export function TreatmentCard({ fusion, onOpenDrawer }) {  

  const treatment = fusion?.insulin?.treatment;

  return (
    <>
<div className="card">
        <div className="card-header-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <h2
            className="card-title"
            style={{ margin: 0, paddingRight: "8px" }}
          >
            <InsulinIcon className="card-icon" />
            Tratamiento establecido
          </h2>
  
          <button
    className="card-action-btn"
    onClick={onOpenDrawer}
>
    →
</button>
        </div>
  
        <p className="card-subtitle">
          Esquema terapéutico actual
        </p>
  
        <div className="metrics-list">
          <div className="metric-row">
            <div className="metric-left">
              <p className="metric-title">
                Tratamiento
              </p>
            </div>
          
            <p className="metric-value">
              {treatment?.therapy ?? "—"}
            </p>
          </div>
  
          <div className="metric-row">
            <div className="metric-left">
              <p className="metric-title">
                Insulinas
              </p>
            </div>
  
            <p className="metric-value">
              {treatment
                ? `${treatment.basal.insulin} + ${treatment.bolus.insulin}`
                : "—"}
            </p>
          </div>
  
          <div className="metric-row">
            <div className="metric-left">
              <p className="metric-title">
                Dosis total diaria
              </p>
  
              <p className="metric-helper">
                Últimos 14 días
              </p>
            </div>
  
            <p className="metric-value">
              {fusion?.insulin?.total_per_day ?? "—"} UI
            </p>
          </div>
        </div>
      </div>
  
    
    </>
  );
}