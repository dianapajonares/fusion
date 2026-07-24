import React, { useState } from "react";
import "../layout/Forms.css";
import "../layout/TreatmentDrawerContent.css";

export default function HbA1cDrawerContent({
  patientId,
  patient,
  latestHbA1cEvent,
  hba1cTarget,
  reloadManualEvents,
  onClose,
}) {
  const [date, setDate] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const [target, setTarget] = useState(
    hba1cTarget ? hba1cTarget.toString() : "7.0"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "Sin registros";

    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (!date || !value) {
        setError("Completa la fecha y el valor.");
        return;
      }

      const timestamp = new Date(date + "T00:00").toISOString();

      const hbResp = await fetch(
        "http://127.0.0.1:8000/api/v1/manual-events/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            patient_id: Number(patientId),
            event_type: "hba1c",
            timestamp,
            value: Number(value),
            unit: "%",
            subtype: null,
            note: note || null,
            extra: null,
          }),
        }
      );

      if (!hbResp.ok) {
        throw new Error("No se pudo registrar la HbA1c.");
      }

      const newPrefs = {
        ...(patient?.dashboard_prefs || {}),
        meta_hba1c: parseFloat(target),
      };

      const prefResp = await fetch(
        `http://127.0.0.1:8000/api/v1/pacientes/${patientId}/preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            dashboard_prefs: newPrefs,
          }),
        }
      );

      if (!prefResp.ok) {
        throw new Error("No se pudo actualizar la meta.");
      }

      reloadManualEvents();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="drawer-section">
        <p className="drawer-section-title">
          Última medición
        </p>

        <div className="drawer-card">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "34px",
                  color: "#2563eb",
                }}
              >
                {latestHbA1cEvent?.value ?? "--"}%
              </h1>

              <p
                style={{
                  marginTop: "6px",
                  color: "#6b7280",
                }}
              >
                {formatDate(latestHbA1cEvent?.timestamp)}
              </p>
            </div>

            <div
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "8px 12px",
                borderRadius: "999px",
                fontWeight: 600,
              }}
            >
              Meta: {target}%
            </div>
          </div>

        </div>
      </div>

      <div className="drawer-section">

        <p className="drawer-section-title">
          Registrar nueva medición
        </p>

        <div className="drawer-card">

          <label className="modal-label">
            Fecha de la prueba
          </label>

          <input
            type="date"
            className="modal-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="modal-label">
            Valor (%)
          </label>

          <input
            type="number"
            step="0.1"
            className="modal-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <label className="modal-label">
            Comentario
          </label>

          <textarea
            rows={3}
            className="modal-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
                    <div className="drawer-section" style={{ padding: 0, marginTop: "24px" }}>
            <p className="drawer-section-title">
              Meta terapéutica
            </p>

            <div className="drawer-card">

              <label className="modal-label">
                Objetivo HbA1c (%)
              </label>

              <input
                type="number"
                step="0.1"
                min="5"
                max="10"
                className="modal-input"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />

              <p
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Esta meta se utilizará como referencia en el panel del paciente.
              </p>

            </div>
          </div>

          {error && (
            <p
              style={{
                color: "#dc2626",
                marginTop: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </p>
          )}

        </div>

      </div>

      <div
        className="modal-footer"
        style={{
          marginTop: "28px",
        }}
      >
        <button
          className="btn-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </button>

        <button
          className="btn-primary"
          disabled={!date || !value || saving}
          onClick={handleSave}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

    </>
  );
}
