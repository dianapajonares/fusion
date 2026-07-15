import React, { useState, useEffect } from 'react';
import '../layout/Dashboard.css';

export function CustomizeDashboardModal({ onClose, onSave, currentPrefs }) {
  const [prefs, setPrefs] = useState(currentPrefs);
  const [applyGlobally, setApplyGlobally] = useState(false);

  // When props change, update state
  useEffect(() => {
    if (currentPrefs) {
      setPrefs(currentPrefs);
    }
  }, [currentPrefs]);

  const handleToggle = (key) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    onSave(prefs, applyGlobally);
    onClose();
  };

  const cards = [
    { key: 'glucosa', label: 'Glucosa y Tiempo en Rangos' },
    { key: 'grafica_glucosa', label: 'Gráfica de Glucosa (14 días)' },
    { key: 'eventos', label: 'Eventos Relevantes' },
    { key: 'hba1c', label: 'HbA1c' },
    { key: 'insulina', label: 'Distribución de Insulina' },
    { key: 'ingesta', label: 'Ingesta Energética' },
    { key: 'actividad', label: 'Actividad Física' },
    { key: 'sueno', label: 'Sueño' },
    { key: 'estres_ciclo', label: 'Estrés y Ciclo Menstrual' }
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '1rem', color: '#111827' }}>Personalizar Dashboard</h2>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '14px' }}>
          Selecciona qué tarjetas deseas visualizar en tu panel de control.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
          {cards.map((card) => (
            <label key={card.key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', background: prefs[card.key] ? '#eff6ff' : '#fff' }}>
              <input
                type="checkbox"
                checked={!!prefs[card.key]}
                onChange={() => handleToggle(card.key)}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '15px', color: '#374151', fontWeight: 500 }}>{card.label}</span>
            </label>
          ))}
        </div>

        <div style={{ marginBottom: '2rem', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={applyGlobally}
              onChange={(e) => setApplyGlobally(e.target.checked)}
              style={{ marginRight: '10px', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              Guardar como predeterminado para todos mis pacientes
            </span>
          </label>
        </div>

        <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
