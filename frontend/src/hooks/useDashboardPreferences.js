import { useState, useEffect } from 'react';

const DEFAULT_PREFS = {
  glucosa: true,
  eventos: true,
  hba1c: true,
  insulina: true,
  ingesta: true,
  actividad: true,
  sueno: true,
  estres_ciclo: true,
  grafica_glucosa: false
};

export function useDashboardPreferences(pacienteId) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      // Fetch global prefs (medico)
      const meRes = await fetch('http://127.0.0.1:8000/api/v1/auth/me', { credentials: 'include' });
      let globalPrefs = null;
      if (meRes.ok) {
        const meData = await meRes.json();
        globalPrefs = meData.dashboard_prefs;
      }

      // Fetch patient prefs
      let patientPrefs = null;
      if (pacienteId) {
        const patRes = await fetch(`http://127.0.0.1:8000/api/v1/pacientes/${pacienteId}`, { credentials: 'include' });
        if (patRes.ok) {
          const patData = await patRes.json();
          patientPrefs = patData.dashboard_prefs;
        }
      }

      // Priority: patient prefs > global prefs > default prefs
      const finalPrefs = { ...DEFAULT_PREFS, ...(globalPrefs || {}), ...(patientPrefs || {}) };
      setPrefs(finalPrefs);
    } catch (err) {
      console.error("Error fetching preferences", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, [pacienteId]);

  const savePrefs = async (newPrefs, applyGlobally = false) => {
    try {
      // Optimistic update
      setPrefs(newPrefs);
      if (applyGlobally) {
        await fetch('http://127.0.0.1:8000/api/v1/auth/me/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboard_prefs: newPrefs }),
          credentials: 'include'
        });
        if (pacienteId) {
          await fetch(`http://127.0.0.1:8000/api/v1/pacientes/${pacienteId}/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dashboard_prefs: null }),
            credentials: 'include'
          });
        }
      } else if (pacienteId) {
        await fetch(`http://127.0.0.1:8000/api/v1/pacientes/${pacienteId}/preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboard_prefs: newPrefs }),
          credentials: 'include'
        });
      }
    } catch (err) {
      console.error("Error saving preferences", err);
    }
  };

  return { prefs, loading, savePrefs };
}
