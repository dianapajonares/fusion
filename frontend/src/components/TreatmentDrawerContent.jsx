import React from "react";
import "../layout/TreatmentDrawerContent.css";

export default function TreatmentDrawerContent({ treatment }) {

  if (!treatment) {
    return <p>No hay información del tratamiento.</p>;
  }

  return (
    <>

      <div className="drawer-section">
        <p className="drawer-section-title">
          Esquema terapéutico
        </p>

        <div className="drawer-card">
        <div className="therapy-card">
    <span className="therapy-value">
        {treatment.therapy}
    </span>
</div>
        </div>
      </div>

      <div className="drawer-section">
        <p className="drawer-section-title">
          Insulina basal
        </p>

        <div className="drawer-card">

        <h3 className="insulin-name">
    {treatment.basal.insulin}
</h3>
          {treatment.basal.schedule.map((dose, index) => (
            <div className="drawer-row" key={index}>
              <span className="drawer-label">
                {dose.label}
              </span>

              <span className="dose-chip">
                {dose.units} UI
              </span>
            </div>
          ))}

        </div>
      </div>

      <div className="drawer-section">
        <p className="drawer-section-title">
          Insulina prandial
        </p>

        <div className="drawer-card">

        <h3 className="insulin-name">
          {treatment.bolus.insulin}</h3>

          {treatment.bolus.schedule.map((dose, index) => (
            <div className="drawer-row" key={index}>
              <span className="drawer-label">
                {dose.meal}
              </span>

              <span className="drawer-value">
                {dose.units} UI
              </span>
            </div>
          ))}

        </div>
      </div>

      <div className="drawer-section">
        <p className="drawer-section-title">
          Último ajuste
        </p>

        <div className="drawer-card">

          {treatment.adjustments.length > 0 ? (

            <div className="adjustment-card">

              <div>
                <strong>
                  {treatment.adjustments[0].meal}
                </strong>

                <p className="metric-helper">
                  {treatment.adjustments[0].reason}
                </p>
              </div>

              <div
                className={
                  treatment.adjustments[0].change > 0
                    ? "adjustment-positive"
                    : "adjustment-negative"
                }
              >
                {treatment.adjustments[0].change > 0
                  ? `+${treatment.adjustments[0].change}`
                  : treatment.adjustments[0].change}{" "}
                UI
              </div>

            </div>

          ) : (
            <p className="metric-helper">
              No hay ajustes registrados.
            </p>
          )}

        </div>
      </div>

    </>
  );
}