import React from "react";

export default function TreatmentDetailCard({ treatment, onClose }) {
  return (
    <section className="card treatment-detail-card">
      <div className="card-header-row">
        <h2 className="card-title">
          Tratamiento establecido
        </h2>

        <button className="card-action" onClick={onClose}>
          ✕
        </button>
      </div>

      <p className="card-subtitle">
        Esquema terapéutico actual
      </p>

      <hr />

      <h3>Esquema terapéutico</h3>

      <p>{treatment?.therapy}</p>
    </section>
  );
}