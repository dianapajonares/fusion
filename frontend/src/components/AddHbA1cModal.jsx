// src/components/AddHbA1cModal.jsx
import React, { useState } from "react";
import "../layout/Forms.css"

export function AddHbA1cModal({ patientId, onClose, onSaved }) {
  const [date, setDate] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const timestamp = new Date(date + "T00:00").toISOString();

      const resp = await fetch(
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

      if (!resp.ok) {
        console.error("Error al guardar HbA1c:", resp.status);
        setError("No se pudo guardar la HbA1c.");
        return;
      }

      if (onSaved) {
        onSaved();
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la HbA1c.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = date && value;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Registrar HbA1c</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-label">Fecha de la prueba</label>
          <input
            type="date"
            className="modal-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="modal-label">Valor (%)</label>
          <input
            type="number"
            step="0.1"
            className="modal-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <label className="modal-label">Comentario (opcional)</label>
          <textarea
            className="modal-textarea"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
