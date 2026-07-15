import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../layout/Dashboard.css";
import "../layout/Tarjetas.css";
import "../layout/PacienteHeader.css";
import "../layout/GlucosaCard.css";

import { AddHbA1cModal } from "../components/AddHbA1cModal.jsx";
import { CustomizeDashboardModal } from "../components/CustomizeDashboardModal.jsx";
import { useDashboardPreferences } from "../hooks/useDashboardPreferences.js";
import { TopBarTabs } from "../components/TopBar.jsx";
import { TiempoEnRangosCard } from "../components/TiempoEnRangosCard.jsx";
import { InfoTooltip } from "../components/InfoToolTip.jsx";
import { HbA1cChart } from "../components/HbA1Cchart.jsx";
import { CicloBar } from "../components/CicloBar.jsx";
import { GlucoseChart } from "../components/glucoseChart.jsx";
import {
  PatientIcon,
  ExpandMoreIcon,
  GlucoseIcon,
  HbA1cIcon,
  InsulinIcon,
  CarbsIcon,
  ActivityIcon,
  SleepIcon,
  CycleIcon,
  StressIcon,
} from "../icons/Icons.jsx";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};
const formatMinutes = (min) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

function StressLevelBar({ value, max = 5 }) {
  const safeValue = Math.max(0, Math.min(value, max));

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < safeValue;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: "10px",
                borderRadius: "4px",
                backgroundColor: filled ? "#fbbf24" : "#e5e7eb",
              }}
            />
          );
        })}
      </div>
      <p
        style={{
          fontSize: "12px",
          marginTop: "4px",
          color: "#6b7280",
          textAlign: "right",
        }}
      >
        {safeValue} / {max}
      </p>
    </div>
  );
}
function KpiBar({ percent }) {
  const safe = Math.max(0, Math.min(percent, 130));

  return (
    <div style={{ marginTop: "1rem" }}>
      <div
        style={{
          height: "8px",
          background: "#e5e7eb",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${safe}%`,
            height: "100%",
            background: "#93c5fd",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

function PatientDashboard() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("inicio");
  const [fusion, setFusion] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [hba1cHistory, setHba1cHistory] = useState([]);
  const [sheetLevel, setSheetLevel] = useState("collapsed");
  const patientHeaderRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [manualEvents, setManualEvents] = useState([]);
    const [showHbA1cModal, setShowHbA1cModal] = useState(false);
  const [isEditingHbA1cTarget, setIsEditingHbA1cTarget] = useState(false);
  const [tempHbA1cTarget, setTempHbA1cTarget] = useState("");
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const { prefs, loading: prefsLoading, savePrefs } = useDashboardPreferences(pacienteId);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [insulinView, setInsulinView] = useState("summary");
  const rawSexo = patient?.sexo ?? fusion?.patient?.sexo ?? "";
  const sexoNormalizado = rawSexo.toString().toLowerCase();
  const esMujer = ["female", "f", "mujer", "femenino"].includes(
    sexoNormalizado
  );
  const [activeEventFilters, setActiveEventFilters] = useState({
    hipo: true,
    hipo_severa: true,
    hiper_severa: true,
  });
  const PERIOD_DAYS = 14;


  const activeCardsTop = [prefs.glucosa || prefs.eventos, prefs.hba1c].filter(Boolean).length;
  const topGridColumns = activeCardsTop === 2 ? "4.1fr 1.4fr" : "1fr";

  const cardGroupColumns = (prefs.glucosa && prefs.eventos) 
    ? "1.3fr 1.2fr 1fr" 
    : (prefs.glucosa ? "1.3fr 1.2fr" : "1fr");

  const bottomCardsCount = [prefs.insulina, prefs.ingesta, prefs.actividad, prefs.sueno, prefs.estres_ciclo, prefs.eventos && showEventDetails && fusion?.glucose?.event_summary].filter(Boolean).length;
  const totalBottomCards = prefs.glucosa ? bottomCardsCount : bottomCardsCount + activeCardsTop;
  const bottomGridColumns = `repeat(${totalBottomCards || 1}, minmax(0, 1fr))`;

  const [startDate, setStartDate] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - PERIOD_DAYS);
    return start;
  });
  
  const getEndDate = (start) => {
    const end = new Date(start);
    end.setDate(start.getDate() + PERIOD_DAYS);
    return end;
  };
  
  const formatRangeDate = (date) =>
    date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const isFuture = getEndDate(startDate) >= new Date();

  const movePeriod = (direction) => {
    setStartDate((prev) => {
      const newStart = new Date(prev);
      newStart.setDate(prev.getDate() + direction * PERIOD_DAYS);
      return newStart;
    });
  };

  const toggleFilter = (type) => {
    setActiveEventFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fusionRes, patientRes, manualRes] = await Promise.all([
          fetch(
            `http://127.0.0.1:8000/api/v1/fusion/${pacienteId}/fusion?days=14`,
            {
              credentials: "include",
            }
          ),
          fetch(`http://127.0.0.1:8000/api/v1/pacientes/${pacienteId}`, {
            credentials: "include",
          }),
          fetch(
            `http://127.0.0.1:8000/api/v1/manual-events/paciente/${pacienteId}`,
            {
              credentials: "include",
            }
          ),
        ]);

        if (
          fusionRes.status === 401 ||
          patientRes.status === 401 ||
          manualRes.status === 401
        ) {
          navigate("/", { replace: true });
          return;
        }

        if (!fusionRes.ok) {
          console.error("Error consultando fusión");
        } else {
          const fusionData = await fusionRes.json();
          setFusion(fusionData);
        }

        if (!patientRes.ok) {
          console.error("Error consultando paciente");
        } else {
          const patientData = await patientRes.json();
          setPatient(patientData);
        }

        if (!manualRes.ok) {
          console.error("Error consultando eventos manuales");
        } else {
          const eventsData = await manualRes.json();
          setManualEvents(eventsData);
        }
      } catch (err) {
        console.error("Error en fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pacienteId, navigate]);

  useEffect(() => {
    async function loadHistory() {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/manual-events/hba1c/${pacienteId}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const json = await res.json();
        setHba1cHistory(
          json.map((e) => ({
            timestamp: new Date(e.timestamp).toLocaleDateString(),
            value: e.value,
          }))
        );
      }
    }
    loadHistory();
  }, [pacienteId, showHbA1cModal]);

    const handleSaveHbA1cTarget = async () => {
    try {
      const newPrefs = { ...(patient?.dashboard_prefs || {}), meta_hba1c: parseFloat(tempHbA1cTarget) };
      const res = await fetch(`http://127.0.0.1:8000/api/v1/pacientes/${pacienteId}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_prefs: newPrefs }),
        credentials: "include",
      });
      if (res.ok) {
        setIsEditingHbA1cTarget(false);
        setPatient({ ...patient, dashboard_prefs: newPrefs });
      }
    } catch (err) {
      console.error("Error updating hba1c target:", err);
    }
  };

  const reloadManualEvents = async () => {
    try {
      const manualRes = await fetch(
        `http://127.0.0.1:8000/api/v1/manual-events/paciente/${pacienteId}`,
        { credentials: "include" }
      );
      if (manualRes.ok) {
        const eventsData = await manualRes.json();
        setManualEvents(eventsData);
      }
    } catch (err) {
      console.error("Error recargando eventos manuales:", err);
    } finally {
      setShowHbA1cModal(false);
    }
  };

  useEffect(() => {
    if (!showPatientInfo) return;

    function handleClickOutside(event) {
      if (
        patientHeaderRef.current &&
        !patientHeaderRef.current.contains(event.target)
      ) {
        setShowPatientInfo(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPatientInfo]);

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    if (sectionId === "pacientes") {
      navigate("/pacientes");
    }
    if (sectionId === "inicio") {
      navigate(`/pacientes/${pacienteId}`);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">Cargando datos del paciente...</div>
    );
  }

  if (!fusion) {
    return (
      <div className="dashboard-loading">
        No se encontraron datos de fusión para este paciente.
      </div>
    );
  }
  console.log(fusion.glucose.events);

  const avgGlucose = fusion.glucose?.avg ?? null;
  const seriesValues = fusion.glucose?.series?.map(s => s.value) || [];
  
  let cv = null;
  if (avgGlucose && seriesValues.length > 0) {
    const variance = seriesValues.reduce((acc, val) => acc + Math.pow(val - avgGlucose, 2), 0) / seriesValues.length;
    const stdDev = Math.sqrt(variance);
    cv = (stdDev / avgGlucose) * 100;
  }

  let gmi = null;
  if (avgGlucose) {
    gmi = 3.31 + 0.02392 * avgGlucose;
  }

  const totalReadings = seriesValues.length;
  const avgReadingsPerDay = PERIOD_DAYS > 0 ? (totalReadings / PERIOD_DAYS).toFixed(0) : 0;
  const cgmActivePercent = 98; // simulado
  const cgmActiveDays = "13 días 21 h"; // simulado

  const dietEvents = fusion.diet?.events ?? 0;
  const totalKcal = fusion.diet?.total_kcal ?? 0;
  const insulinTotalPerDay = fusion.insulin?.total_per_day ?? null;
  const insulinBasalRatio = fusion.insulin?.basal_ratio ?? null;
  const insulinBolusRatio = fusion.insulin?.bolus_ratio ?? null;

  // Datos ficticios
  const cicloFake = {
    dia_actual: 5,
    duracion_ciclo: 28,
  };

  const stressFake = {
    level: 3, // nivel 1–5
  };
  const avgKcalPerDay = fusion.diet?.avg_kcal_per_day ?? 1850;

  const activityAvgMinutes = fusion.activity?.avg_minutes_per_day ?? 40;

  const sleepAvgHours = fusion.sleep?.avg_hours_per_night ?? 7.2;
  // Periodo legible
  let periodoLabel = "";
  if (fusion.range?.start && fusion.range?.end) {
    const start = new Date(fusion.range.start);
    const end = new Date(fusion.range.end);
    periodoLabel = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  } else {
    periodoLabel = "Últimos 14 días";
  }

  // Nombre del paciente
  const patientName = patient
    ? `${patient.nombre} ${patient.apellido_paterno ?? ""} ${
        patient.apellido_materno ?? ""
      }`.trim()
    : `Paciente ${pacienteId}`;

  let latestHbA1cEvent = null;
  if (manualEvents && manualEvents.length > 0) {
    const hbEvents = manualEvents.filter(
      (ev) => ev.event_type === "hba1c" && ev.value !== null
    );
    if (hbEvents.length > 0) {
      hbEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      latestHbA1cEvent = hbEvents[0];
    }
  }

  const hba1cValue = latestHbA1cEvent?.value ?? patient?.hba1c ?? null;
  const hba1cDate = latestHbA1cEvent?.timestamp ?? null;
  const hba1cTarget = patient?.dashboard_prefs?.meta_hba1c ?? 7.0;

  return (
    <div className="app-root">
      <TopBarTabs
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <main className="dashboard-main">
        <header className="dashboard-header" ref={patientHeaderRef}>
          <div className="patient-header-group">
            <button
              className={`btn btn-outline btn-round patient-chip ${
                showPatientInfo ? "is-open" : ""
              }`}
              onClick={() => setShowPatientInfo((prev) => !prev)}
            >
              <PatientIcon className="patient-chip-icon" />

              <div className="patient-chip-text">
                <span className="patient-chip-name">{patientName}</span>
                <span className="patient-chip-period">
                  Paciente
                </span>
              </div>

              <ExpandMoreIcon
                className={`chip-arrow ${showPatientInfo ? "rotated" : ""}`}
              />
            </button>

            
          </div>
          <div className="period-navigation">
  <div className="period-box">
    <button
      onClick={() => movePeriod(-1)}
      className="period-arrow"
    >
      ‹
    </button>

    <div className="period-center">
      <span className="period-text">
        {formatRangeDate(startDate)} – {formatRangeDate(getEndDate(startDate))}
      </span>

      <span className="period-label">Periodo</span>
    </div>

    <button
      onClick={() => movePeriod(1)}
      className="period-arrow"
      disabled={isFuture}
    >
      ›
    </button>
  </div>
</div>

          <button
            type="button"
            className="btn btn-outline btn-round btn-md patient-add-btn"
            onClick={() => setShowCustomizeModal(true)}
            style={{ marginLeft: '10px' }}
          >
            Personalizar Panel
          </button>
        </header>

        {showPatientInfo && (() => {
          // Helper: calculate age
          let ageText = "";
          if (patient?.fecha_nacimiento) {
            const birthDate = new Date(patient.fecha_nacimiento);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            ageText = ` (${age} años)`;
          }

          // Helper: format chronic diseases into array
          const rawDiseases = patient?.enfermedades_cronicas || "Diabetes tipo 1 desde los 12 años. Hipotiroidismo autoinmune.";
          const diseaseList = rawDiseases.split('.').map(d => d.trim()).filter(d => d.length > 0);

          return (
            <div className="expanded-patient-panel">
              {/* Column 1: Datos Generales */}
              <div className="epp-column epp-col-general">
                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Fecha de nacimiento:</span>
                    <strong className="epp-value">{formatDate(patient?.fecha_nacimiento) || "12 mar 1998"}{ageText}</strong>
                  </div>
                </div>

                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Tiempo CGM Activo:</span>
                    <strong className="epp-value">100%</strong>
                  </div>
                </div>

                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Diagnóstico desde:</span>
                    <strong className="epp-value">{patient?.anio_diagnostico || "2010"}</strong>
                  </div>
                </div>

                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Enfermedades crónicas:</span>
                    <ul className="epp-bullets">
                      {diseaseList.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="epp-divider"></div>

              {/* Column 2: Complicaciones + Nefropatía */}
              <div className="epp-column epp-col-middle">
                {/* Complicaciones */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <h3 className="epp-title">Complicaciones</h3>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">Retinopatía</span>
                    <span className="epp-stat epp-normal"><span className="epp-dot epp-dot-green"></span>Normal</span>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">Neuropatía</span>
                    <span className="epp-stat epp-neutral"><span className="epp-dot epp-dot-gray"></span>No evaluado</span>
                  </div>
                </div>

                {/* Nefropatía */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21c-5-5-5-10-5-10V5h10v6s0 5-5 10z" />
                    </svg>
                    <h3 className="epp-title">Nefropatía</h3>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">eGFR</span>
                    <strong className="epp-stat-val">92 <span className="epp-unit">mL/min/1.73m²</span></strong>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">Albúmina en orina</span>
                    <strong className="epp-stat-val">12 <span className="epp-unit">mg/g</span></strong>
                  </div>
                </div>
              </div>

              <div className="epp-divider"></div>

              {/* Column 3: Función Hepática + Medicamentos */}
              <div className="epp-column epp-col-right">
                {/* Función Hepática */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                    </svg>
                    <h3 className="epp-title">Función hepática</h3>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">ALT</span>
                    <strong className="epp-stat-val">22 <span className="epp-unit">U/L</span></strong>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">AST</span>
                    <strong className="epp-stat-val">19 <span className="epp-unit">U/L</span></strong>
                  </div>
                </div>

                {/* Medicamentos */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <h3 className="epp-title">Medicamentos adicionales</h3>
                  </div>
                  <div className="epp-med-list">
                    <ul className="epp-bullets">
                      <li>Cortisona</li>
                      <li>Levotiroxina</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="summary-banner">
          <div className="banner-alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="banner-alert-icon" fill="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="banner-alert-text">
              <h3>Control glucémico fuera de objetivo</h3>
              <p>Alta glucosa promedio y alta variabilidad</p>
            </div>
          </div>
          
          <div className="banner-stats">
            <div className="banner-stat-item">
              <svg xmlns="http://www.w3.org/2000/svg" className="banner-stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="banner-stat-content">
                <span className="banner-stat-title">Tiempo CGM activo</span>
                <span className="banner-stat-value">{cgmActivePercent}%</span>
                <span className="banner-stat-subtitle">{cgmActiveDays}</span>
              </div>
            </div>
            
            <div className="banner-stat-item">
              <svg xmlns="http://www.w3.org/2000/svg" className="banner-stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <div className="banner-stat-content">
                <span className="banner-stat-title">Lecturas</span>
                <span className="banner-stat-value">{totalReadings}</span>
                <span className="banner-stat-subtitle">Promedio {avgReadingsPerDay}/día</span>
              </div>
            </div>
            
            <div className="banner-stat-item">
              <svg xmlns="http://www.w3.org/2000/svg" className="banner-stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="banner-stat-content">
                <span className="banner-stat-title">HbA1c estimada</span>
                <span className="banner-stat-value">{gmi !== null ? gmi.toFixed(1) : "—"}%</span>
                <span className="banner-stat-subtitle">Calculada (GMI)</span>
              </div>
            </div>

            <div className="banner-stat-item">
              <svg xmlns="http://www.w3.org/2000/svg" className="banner-stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="banner-stat-content">
                <span className="banner-stat-title">Periodo del informe</span>
                <span className="banner-stat-value">{PERIOD_DAYS} días</span>
                <span className="banner-stat-subtitle">{formatRangeDate(startDate)} - {formatRangeDate(getEndDate(startDate))}</span>
              </div>
            </div>
          </div>
        </div>

        {prefs.glucosa ? (
          <>
            <section className="dashboard-grid-top" style={{ gridTemplateColumns: topGridColumns }}>
              {(prefs.glucosa || prefs.eventos) && (
            prefs.glucosa ? (
              <div className="card card-group" style={{ gridTemplateColumns: (prefs.glucosa && prefs.eventos) ? "1.3fr 1.2fr 1fr" : "1.3fr 1.2fr" }}>
                {prefs.glucosa && (
                  <>
                    <div className="group-item">
                      <TiempoEnRangosCard tir={fusion.glucose?.tir} />
                    </div>

                    <div className="group-item metrics-card-with-button">
                      <div className="subcard-inner" style={{ position: "relative" }}>
                        <h2 className="card-title">Métricas de Glucosa</h2>
                        <p className="card-subtitle"> </p>

                        <div className="metrics-list" style={{ marginTop: '16px' }}>
                          <div className="metric-row with-icon">
                            <div className="metric-icon-box">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                            <div className="metric-left" style={{ flex: 1 }}>
                              <p className="metric-title" style={{ fontWeight: 600, color: '#111827' }}>Glucosa promedio</p>
                              <p className="metric-helper" style={{ fontSize: '11px' }}>Objetivo: &lt;154 mg/dL</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p className="metric-value" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                                {avgGlucose !== null ? `${avgGlucose.toFixed(2)} mg/dL` : "—"}
                              </p>
                              {avgGlucose > 154 && (
                                <span className="status-pill red">Fuera de objetivo</span>
                              )}
                            </div>
                          </div>

                          <div className="metric-row with-icon">
                            <div className="metric-icon-box purple">
                              GMI
                            </div>
                            <div className="metric-left" style={{ flex: 1 }}>
                              <p className="metric-title" style={{ fontWeight: 600, color: '#111827' }}>Indicador de gestión (GMI)</p>
                              <p className="metric-helper" style={{ fontSize: '11px' }}>Objetivo: &lt;7%</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p className="metric-value" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                                {gmi !== null ? `${gmi.toFixed(1)}%` : "—"}
                              </p>
                              {gmi !== null && gmi > 7 && (
                                <span className="status-pill red">Fuera de objetivo</span>
                              )}
                            </div>
                          </div>

                          <div className="metric-row with-icon">
                            <div className="metric-icon-box green">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                            <div className="metric-left" style={{ flex: 1 }}>
                              <p className="metric-title" style={{ fontWeight: 600, color: '#111827' }}>Variabilidad (CV)</p>
                              <p className="metric-helper" style={{ fontSize: '11px' }}>Objetivo: &lt;36%</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p className="metric-value" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                                {cv !== null ? `${cv.toFixed(1)}%` : "—"}
                              </p>
                              {cv !== null && cv > 36 && (
                                <span className="status-pill red">Elevada</span>
                              )}
                            </div>
                          </div>

                          {cv !== null && cv > 36 && (
                            <div className="metric-info-box">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <div>
                                <h4>Variabilidad elevada</h4>
                                <p>La variabilidad por encima del objetivo aumenta el riesgo de eventos de hipo e hiperglucemia.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* 3. Eventos relevantes */}
                {prefs.eventos && (
                  <div className="group-item events-card">
                    <div className="subcard-inner">
                      <h2 className="card-title">Eventos relevantes</h2>
                      <p className="card-subtitle">Total en el periodo</p>

                      <div style={{ marginTop: '16px' }}>
                        <div className="event-card-item">
                          <div className="event-card-left">
                            <div className="event-card-icon up">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            </div>
                            <div>
                              <p className="event-card-title">Hiper severa</p>
                              <p className="event-card-subtitle">&gt; 250 mg/dL</p>
                            </div>
                          </div>
                          <div className={`event-card-count ${fusion?.glucose?.eventos?.hiper_severa > 0 ? "red" : ""}`}>
                            {fusion?.glucose?.eventos?.hiper_severa ?? "—"}
                          </div>
                        </div>

                        <div className="event-card-item">
                          <div className="event-card-left">
                            <div className="event-card-icon drop">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="event-card-title">Hipoglucemias</p>
                              <p className="event-card-subtitle">&lt; 70 mg/dL</p>
                            </div>
                          </div>
                          <div className={`event-card-count ${fusion?.glucose?.eventos?.hipo > 0 ? "orange" : ""}`}>
                            {fusion?.glucose?.eventos?.hipo ?? "—"}
                          </div>
                        </div>

                        <div className="event-card-item">
                          <div className="event-card-left">
                            <div className="event-card-icon down">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                            <div>
                              <p className="event-card-title">Hipo severa</p>
                              <p className="event-card-subtitle">&lt; 54 mg/dL</p>
                            </div>
                          </div>
                          <div className={`event-card-count ${fusion?.glucose?.eventos?.hipo_severa > 0 ? "red" : ""}`}>
                            {fusion?.glucose?.eventos?.hipo_severa ?? "—"}
                          </div>
                        </div>
                      </div>
                      {!prefs.grafica_glucosa && (
                        <button
                          className="btn-primary btn-plus-floating"
                          onClick={() =>
                            setSheetLevel((prev) =>
                              prev === "collapsed" ? "half" : "collapsed"
                            )
                          }
                          title="Ver detalles de glucosa"
                        >
                          Ver detalles
                          <span className="arrow"></span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card events-card">
                <div className="subcard-inner">
                  <h2 className="card-title">Eventos relevantes</h2>
                  <p className="card-subtitle">Total en el periodo</p>

                  <div className="metric-row">
                    <div>
                      <p className="metric-title">Hiper severa</p>
                      <p className="metric-subtitle">&gt; 250 mg/dL</p>
                    </div>
                    <p>{fusion?.glucose?.eventos?.hiper_severa ?? "—"}</p>
                  </div>

                  <div className="metric-row">
                    <div>
                      <p className="metric-title">Hipoglucemias</p>
                      <p className="metric-subtitle">&lt; 70 mg/dL</p>
                    </div>
                    <p>{fusion?.glucose?.eventos?.hipo ?? "—"}</p>
                  </div>

                  <div className="metric-row">
                    <div>
                      <p className="metric-title">Hipo severa</p>
                      <p className="metric-subtitle">&lt; 54 mg/dL</p>
                    </div>
                    <p>{fusion?.glucose?.eventos?.hipo_severa ?? "—"}</p>
                  </div>
                  {!prefs.grafica_glucosa && (
                    <button
                      className="btn-primary btn-plus-floating"
                      onClick={() =>
                        setSheetLevel((prev) =>
                          prev === "collapsed" ? "half" : "collapsed"
                        )
                      }
                      title="Ver detalles de glucosa"
                    >
                      Ver detalles
                      <span className="arrow"></span>
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {prefs.hba1c && (
            <div className="card">
                            <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="card-title" style={{ margin: 0 }}>
                    <HbA1cIcon className="card-icon" /> HbA1c
                  </h2>
                  <button
                    className="card-action"
                    style={{ width: '24px', height: '24px', background: 'transparent', color: '#9ca3af' }}
                    title="Editar meta de HbA1c"
                    onClick={() => {
                      setTempHbA1cTarget(hba1cTarget.toString());
                      setIsEditingHbA1cTarget(!isEditingHbA1cTarget);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  className="card-action"
                  onClick={() => setShowHbA1cModal(true)}
                  title="Agregar información"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {isEditingHbA1cTarget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#4b5563' }}>Nueva meta (%):</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={tempHbA1cTarget} 
                    onChange={(e) => setTempHbA1cTarget(e.target.value)}
                    style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  />
                  <button 
                    onClick={handleSaveHbA1cTarget}
                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer' }}
                  >Guardar</button>
                </div>
              )}
              <p className="card-subtitle">Hemoglobina glicosilada</p>
              <p className="kpi-big">
                {hba1cValue !== null ? `${hba1cValue.toFixed(1)} %` : "—"}
              </p>
              <p className="metric-subtitle">
                {hba1cDate
                  ? `Última medición: ${formatDate(hba1cDate)}`
                  : "Sin registro reciente"}
              </p>
              <div
                className="hba1c-chart-container"
                onClick={() => setShowHistory((prev) => !prev)}
              >
                {!showHistory ? (
                  <HbA1cChart data={hba1cHistory.slice(-4)} targetValue={hba1cTarget} />
                ) : (
                  <div className="hba1c-history">
                    {hba1cHistory
                      .slice(-4)
                      .reverse()
                      .map((item, i) => (
                        <div key={i} className="history-row">
                          <span>{item.timestamp}</span>
                          <span>{item.value} %</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>{" "}
            </div>
          )}
            </section>
            
            {(prefs.grafica_glucosa || (prefs.glucosa && sheetLevel !== "collapsed")) && (
              <section className="dashboard-grid">
                {(prefs.grafica_glucosa || (prefs.glucosa && sheetLevel !== "collapsed")) && (
            <div className="card glucose-expanded">
              <div className="sheet-header">
           <h2 className="card-title">
  Glucosa (Ventana de 14 dias)
</h2>


                {!prefs.grafica_glucosa && (
                  <button
                    className="sheet-close"
                    onClick={() => setSheetLevel("collapsed")}
                  >
                    ×
                  </button>
                )}
              </div>

              {fusion?.glucose?.series?.length > 0 ? (
                <>
                  <GlucoseChart
                    data={fusion.glucose.series}
                    events={fusion.glucose.events}
                    filters={activeEventFilters}
                    onEventClick={setSelectedEvent}
                  />

                  {/* LEYENDA */}
                  <div className="glucose-legend">
                    {/* RANGOS */}
                    <div className="legend-group">
                      <span className="legend-group-title">Rangos</span>

                      <div className="legend-item">
                        <span className="legend-color green"></span>
                        <span>70–180 mg/dL</span>
                      </div>

                      <div className="legend-item">
                        <span className="legend-color red"></span>
                        <span>&lt; 70 mg/dL</span>
                      </div>

                      <div className="legend-item">
                        <span className="legend-color orange"></span>
                        <span>&gt; 180 mg/dL</span>
                      </div>
                    </div>

                    {/* EVENTOS */}
                    <div className="legend-group">
                      <span className="legend-group-title">Eventos</span>

                      <div
                        className={`legend-item ${
                          !activeEventFilters.hipo ? "disabled" : ""
                        }`}
                        onClick={() => toggleFilter("hipo")}
                      >
                        <span className="legend-color event-hypo"></span>
                        <span>Hipoglucemia</span>
                      </div>

                      <div
                        className={`legend-item ${
                          !activeEventFilters.hipo_severa ? "disabled" : ""
                        }`}
                        onClick={() => toggleFilter("hipo_severa")}
                      >
                        <span className="legend-color event-severe"></span>
                        <span>Hipo severa</span>
                      </div>

                      <div
                        className={`legend-item ${
                          !activeEventFilters.hiper_severa ? "disabled" : ""
                        }`}
                        onClick={() => toggleFilter("hiper_severa")}
                      >
                        <span className="legend-color event-hyper"></span>
                        <span>Hiper severa</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>No hay datos disponibles</p>
              )}
            </div>
          )}
              </section>
            )}

            <section className="dashboard-grid-bottom" style={{ gridTemplateColumns: bottomGridColumns }}>
              {prefs.insulina && (
            <div className="card">
              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 className="card-title" style={{ margin: 0, paddingRight: '8px' }}>
                  <InsulinIcon className="card-icon" /> Distribución de insulina
                </h2>

                <button
                  className="card-action"
                  onClick={() =>
                    setInsulinView((prev) =>
                      prev === "summary" ? "details" : "summary"
                    )
                  }
                >
                  <span
                    className={`chevron ${
                      insulinView === "details" ? "open" : ""
                    }`}
                  >
                    →
                  </span>
                </button>
              </div>

              {insulinView === "summary" && (
                <>
                  <p className="card-subtitle">Total en el periodo</p>
                  <div className="metrics-list">
                    <div className="metric-row">
                      <div className="metric-left">
                        <p className="metric-title">Dosis total diaria</p>
                        <p className="metric-helper">Últimos 14 días</p>
                      </div>
                      <p className="metric-value">
                        {insulinTotalPerDay !== null
                          ? `${insulinTotalPerDay.toFixed(1)} UI/día`
                          : "—"}
                      </p>
                    </div>

                    <div className="metric-row">
                      <div className="metric-left">
                        <p className="metric-title">Basal</p>
                      </div>
                      <p className="metric-value">
                        {insulinBasalRatio !== null
                          ? `${insulinBasalRatio.toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>

                    <div className="metric-row">
                      <div className="metric-left">
                        <p className="metric-title">Bolus</p>
                      </div>
                      <p className="metric-value">
                        {insulinBolusRatio !== null
                          ? `${insulinBolusRatio.toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {insulinView === "details" && (
                <div className="metrics-list">
                  <div className="metric-row">
                    <p className="metric-title">Basal total (UI)</p>
                    <p className="metric-value">
                      {fusion?.insulin?.basal_total ?? "—"}
                    </p>
                  </div>

                  <div className="metric-row">
                    <p className="metric-title">Bolus total (UI)</p>
                    <p className="metric-value">
                      {fusion?.insulin?.bolus_total ?? "—"}
                    </p>
                  </div>

                  <div className="metric-row">
                    <p className="metric-title">Correcciones</p>
                    <p className="metric-value">
                      {fusion?.insulin?.corrections ?? "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {prefs.ingesta && (
            <div className="card">
              <div className="card-header-with-icon">
                <div>
                  <h2 className="card-title">
                    <CarbsIcon className="card-icon" /> Ingesta energética
                  </h2>
                  <p className="card-subtitle">
                    Promedio diario (kcal) en el periodo
                  </p>
                </div>
              </div>
              <p className="kpi-big">
                {avgKcalPerDay ? `${avgKcalPerDay.toFixed(0)} kcal/día` : "—"}
              </p>

              <KpiBar percent={(avgKcalPerDay / 2000) * 100} />

              <p className="card-subtitle">Referencia: ~2000 kcal/día</p>
            </div>
          )}

          {prefs.actividad && (
            <div className="card">
              <div className="card-header-with-icon">
                <div>
                  <h2 className="card-title">
                    <ActivityIcon className="card-icon" /> Actividad física
                  </h2>
                  <p className="card-subtitle">Promedio</p>
                </div>
              </div>
              <p className="kpi-big">
                {activityAvgMinutes
                  ? `${activityAvgMinutes.toFixed(0)} min/día`
                  : "—"}
              </p>

              <p className="card-subtitle">Recomendación: ≥ 45 min/día</p>
            </div>
          )}

          {prefs.sueno && (
            <div className="card">
              <div className="card-header-with-icon">
                <div>
                  <h2 className="card-title">
                    <SleepIcon className="card-icon" /> Sueño
                  </h2>
                  <p className="card-subtitle">Promedio</p>
                </div>
              </div>
              <p className="kpi-big">
                {sleepAvgHours ? `${sleepAvgHours.toFixed(1)} h/noche` : "—"}
              </p>

              <p className="card-subtitle">Recomendación: 7–9 h/noche</p>
            </div>
          )}

          {prefs.estres_ciclo && (
            esMujer ? (
              <div className="card-stack">
                <div className="card mini-card">
                  <div className="card-header-with-icon">
                    <div>
                      <h2 className="card-title">
                        <CycleIcon className="card-icon" /> Ciclo menstrual
                      </h2>
                      <p className="kpi-medium">
                        Ciclo: día {cicloFake.dia_actual} de{" "}
                        {cicloFake.duracion_ciclo} (estimado)
                      </p>
                    </div>
                  </div>

                  <CicloBar
                    dia={cicloFake.dia_actual}
                    total={cicloFake.duracion_ciclo}
                  />
                </div>

                <div className="card mini-card">
                  <div className="card-header-with-icon">
                    <div>
                      <h2 className="card-title">
                        <StressIcon className="card-icon" /> Estrés
                        (autoreportado)
                      </h2>
                      <p className="card-subtitle">Nivel percibido en consulta</p>
                      <p className="kpi-medium">Nivel: {stressFake.level} / 5</p>
                    </div>
                  </div>

                  <StressLevelBar value={stressFake.level} />
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header-with-icon">
                  <div>
                    <h2 className="card-title">
                      <StressIcon className="card-icon" /> Estrés (autoreportado)
                    </h2>
                    <p className="card-subtitle">Nivel percibido en consulta</p>
                    <p className="kpi-big">Nivel: {stressFake.level} / 5</p>
                  </div>
                </div>

                <StressLevelBar value={stressFake.level} />
              </div>
            )
          )}

          {prefs.eventos && showEventDetails && fusion?.glucose?.event_summary && (
            <div className="card events-expanded" style={{ flex: '0 0 100%', order: 9 }}>
              <div className="sheet-header">
                <h2 className="card-title">Detalle de eventos</h2>

                <button
                  className="sheet-close"
                  onClick={() => setShowEventDetails(false)}
                >
                  ×
                </button>
              </div>

              <div className="events-grid">
                <div className="event-block">
                  <h3>Hiper severa</h3>
                  <p>
                    Total:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hiper_severa.total_minutes
                    )}
                  </p>
                  <p>
                    Promedio:{" "}
                    {fusion.glucose.event_summary.hiper_severa.avg_minutes} min
                  </p>
                  <p>
                    Máximo:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hiper_severa.max_minutes
                    )}
                  </p>
                </div>

                <div className="event-block">
                  <h3>Hipoglucemia</h3>
                  <p>
                    Total:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hipo.total_minutes
                    )}
                  </p>
                  <p>
                    Promedio: {fusion.glucose.event_summary.hipo.avg_minutes}{" "}
                    min
                  </p>
                  <p>
                    Máximo:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hipo.max_minutes
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
            </section>
          </>
        ) : (
          <>
            <section className="dashboard-grid-bottom" style={{ gridTemplateColumns: bottomGridColumns }}>
              {(prefs.glucosa || prefs.eventos) && (
            prefs.glucosa ? (
              <div className="card card-group" style={{ gridTemplateColumns: (prefs.glucosa && prefs.eventos) ? "1.3fr 1.2fr 1fr" : "1.3fr 1.2fr" }}>
                {prefs.glucosa && (
                  <>
                    <div className="group-item">
                      <TiempoEnRangosCard tir={fusion.glucose?.tir} />
                    </div>

                    <div className="group-item metrics-card-with-button">
                      <div className="subcard-inner" style={{ position: "relative" }}>
                        <h2 className="card-title">Métricas de Glucosa</h2>
                        <p className="card-subtitle"> </p>

                        <div className="metrics-list">
                          <div className="metric-row">
                            <div className="metric-left">
                              <p className="metric-title">Glucosa promedio</p>
                              <p className="metric-helper">Objetivo: &lt;154 mg/dL</p>
                            </div>
                            <p className="metric-value">
                              {avgGlucose !== null
                                ? `${avgGlucose.toFixed(2)} mg/dL`
                                : "—"}
                            </p>
                          </div>

                          <div className="metric-row">
                            <div className="metric-left">
                              <p className="metric-title">Indicador de gestión (GMI)</p>
                              <p className="metric-helper">Objetivo: &lt;7%</p>
                            </div>
                            <p className="metric-value">1.48%</p>
                          </div>

                          <div className="metric-row">
                            <div className="metric-left">
                              <p className="metric-title">Variabilidad</p>
                              <p className="metric-helper">Objetivo: &lt;36%</p>
                            </div>
                            <p className="metric-value">45.5%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* 3. Eventos relevantes */}
                {prefs.eventos && (
                  <div className="group-item events-card">
                    <div className="subcard-inner">
                      <h2 className="card-title">Eventos relevantes</h2>
                      <p className="card-subtitle">Total en el periodo</p>

                      <div className="metric-row">
                        <div>
                          <p className="metric-title">Hiper severa</p>
                          <p className="metric-subtitle">&gt; 250 mg/dL</p>
                        </div>
                        <p>{fusion?.glucose?.eventos?.hiper_severa ?? "—"}</p>
                      </div>

                      <div className="metric-row">
                        <div>
                          <p className="metric-title">Hipoglucemias</p>
                          <p className="metric-subtitle">&lt; 70 mg/dL</p>
                        </div>
                        <p>{fusion?.glucose?.eventos?.hipo ?? "—"}</p>
                      </div>

                      <div className="metric-row">
                        <div>
                          <p className="metric-title">Hipo severa</p>
                          <p className="metric-subtitle">&lt; 54 mg/dL</p>
                        </div>
                        <p>{fusion?.glucose?.eventos?.hipo_severa ?? "—"}</p>
                      </div>
                      {!prefs.grafica_glucosa && (
                        <button
                          className="btn-primary btn-plus-floating"
                          onClick={() =>
                            setSheetLevel((prev) =>
                              prev === "collapsed" ? "half" : "collapsed"
                            )
                          }
                          title="Ver detalles de glucosa"
                        >
                          Ver detalles
                          <span className="arrow"></span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card events-card">
                <div className="subcard-inner">
                  <h2 className="card-title">Eventos relevantes</h2>
                  <p className="card-subtitle">Total en el periodo</p>

                  <div className="metric-row">
                    <div>
                      <p className="metric-title">Hiper severa</p>
                      <p className="metric-subtitle">&gt; 250 mg/dL</p>
                    </div>
                    <p>{fusion?.glucose?.eventos?.hiper_severa ?? "—"}</p>
                  </div>

                  <div className="metric-row">
                    <div>
                      <p className="metric-title">Hipoglucemias</p>
                      <p className="metric-subtitle">&lt; 70 mg/dL</p>
                    </div>
                    <p>{fusion?.glucose?.eventos?.hipo ?? "—"}</p>
                  </div>

                  <div className="metric-row">
                    <div>
                      <p className="metric-title">Hipo severa</p>
                      <p className="metric-subtitle">&lt; 54 mg/dL</p>
                    </div>
                    <p>{fusion?.glucose?.eventos?.hipo_severa ?? "—"}</p>
                  </div>
                  {!prefs.grafica_glucosa && (
                    <button
                      className="btn-primary btn-plus-floating"
                      onClick={() =>
                        setSheetLevel((prev) =>
                          prev === "collapsed" ? "half" : "collapsed"
                        )
                      }
                      title="Ver detalles de glucosa"
                    >
                      Ver detalles
                      <span className="arrow"></span>
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {prefs.hba1c && (
            <div className="card">
              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="card-title" style={{ margin: 0 }}>
                    <HbA1cIcon className="card-icon" /> HbA1c
                  </h2>
                  <button
                    className="card-action"
                    style={{ width: '24px', height: '24px', background: 'transparent', color: '#9ca3af' }}
                    title="Editar meta de HbA1c"
                    onClick={() => {
                      setTempHbA1cTarget(hba1cTarget.toString());
                      setIsEditingHbA1cTarget(!isEditingHbA1cTarget);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  className="card-action"
                  onClick={() => setShowHbA1cModal(true)}
                  title="Agregar información"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {isEditingHbA1cTarget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#4b5563' }}>Nueva meta (%):</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={tempHbA1cTarget} 
                    onChange={(e) => setTempHbA1cTarget(e.target.value)}
                    style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  />
                  <button 
                    onClick={handleSaveHbA1cTarget}
                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer' }}
                  >Guardar</button>
                </div>
              )}
              <p className="card-subtitle">Hemoglobina glicosilada</p>
              <p className="kpi-big">
                {hba1cValue !== null ? `${hba1cValue.toFixed(1)} %` : "—"}
              </p>
              <p className="metric-subtitle">
                {hba1cDate
                  ? `Última medición: ${formatDate(hba1cDate)}`
                  : "Sin registro reciente"}
              </p>
              <div
                className="hba1c-chart-container"
                onClick={() => setShowHistory((prev) => !prev)}
              >
                {!showHistory ? (
                  <HbA1cChart data={hba1cHistory.slice(-4)} targetValue={hba1cTarget} />
                ) : (
                  <div className="hba1c-history">
                    {hba1cHistory
                      .slice(-4)
                      .reverse()
                      .map((item, i) => (
                        <div key={i} className="history-row">
                          <span>{item.timestamp}</span>
                          <span>{item.value} %</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>{" "}
            </div>
          )}
              {prefs.insulina && (
            <div className="card">
              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 className="card-title" style={{ margin: 0, paddingRight: '8px' }}>
                  <InsulinIcon className="card-icon" /> Tratamiento establecido
                </h2>

                <button
                  className="card-action"
                  onClick={() =>
                    setInsulinView((prev) =>
                      prev === "summary" ? "details" : "summary"
                    )
                  }
                >
                  <span
                    className={`chevron ${
                      insulinView === "details" ? "open" : ""
                    }`}
                  >
                    →
                  </span>
                </button>
              </div>

              {insulinView === "summary" && (
                <>
                  <p className="card-subtitle">Total en el periodo</p>
                  <div className="metrics-list">
                    <div className="metric-row">
                      <div className="metric-left">
                        <p className="metric-title">Dosis total diaria</p>
                        <p className="metric-helper">Últimos 14 días</p>
                      </div>
                      <p className="metric-value">
                        {insulinTotalPerDay !== null
                          ? `${insulinTotalPerDay.toFixed(1)} UI/día`
                          : "—"}
                      </p>
                    </div>

                    <div className="metric-row">
                      <div className="metric-left">
                        <p className="metric-title">Basal</p>
                      </div>
                      <p className="metric-value">
                        {insulinBasalRatio !== null
                          ? `${insulinBasalRatio.toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>

                    <div className="metric-row">
                      <div className="metric-left">
                        <p className="metric-title">Bolus</p>
                      </div>
                      <p className="metric-value">
                        {insulinBolusRatio !== null
                          ? `${insulinBolusRatio.toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {insulinView === "details" && (
                <div className="metrics-list">
                  <div className="metric-row">
                    <p className="metric-title">Basal total (UI)</p>
                    <p className="metric-value">
                      {fusion?.insulin?.basal_total ?? "—"}
                    </p>
                  </div>

                  <div className="metric-row">
                    <p className="metric-title">Bolus total (UI)</p>
                    <p className="metric-value">
                      {fusion?.insulin?.bolus_total ?? "—"}
                    </p>
                  </div>

                  <div className="metric-row">
                    <p className="metric-title">Correcciones</p>
                    <p className="metric-value">
                      {fusion?.insulin?.corrections ?? "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {prefs.ingesta && (
            <div className="card">
              <div className="card-header-with-icon">
                <div>
                  <h2 className="card-title">
                    <CarbsIcon className="card-icon" /> Ingesta energética
                  </h2>
                  <p className="card-subtitle">
                    Promedio diario (kcal) en el periodo
                  </p>
                </div>
              </div>
              <p className="kpi-big">
                {avgKcalPerDay ? `${avgKcalPerDay.toFixed(0)} kcal/día` : "—"}
              </p>

              <KpiBar percent={(avgKcalPerDay / 2000) * 100} />

              <p className="card-subtitle">Referencia: ~2000 kcal/día</p>
            </div>
          )}

          {prefs.actividad && (
            <div className="card">
              <div className="card-header-with-icon">
                <div>
                  <h2 className="card-title">
                    <ActivityIcon className="card-icon" /> Actividad física
                  </h2>
                  <p className="card-subtitle">Promedio</p>
                </div>
              </div>
              <p className="kpi-big">
                {activityAvgMinutes
                  ? `${activityAvgMinutes.toFixed(0)} min/día`
                  : "—"}
              </p>

              <p className="card-subtitle">Recomendación: ≥ 45 min/día</p>
            </div>
          )}

          {prefs.sueno && (
            <div className="card">
              <div className="card-header-with-icon">
                <div>
                  <h2 className="card-title">
                    <SleepIcon className="card-icon" /> Sueño
                  </h2>
                  <p className="card-subtitle">Promedio</p>
                </div>
              </div>
              <p className="kpi-big">
                {sleepAvgHours ? `${sleepAvgHours.toFixed(1)} h/noche` : "—"}
              </p>

              <p className="card-subtitle">Recomendación: 7–9 h/noche</p>
            </div>
          )}

          {prefs.estres_ciclo && (
            esMujer ? (
              <div className="card-stack">
                <div className="card mini-card">
                  <div className="card-header-with-icon">
                    <div>
                      <h2 className="card-title">
                        <CycleIcon className="card-icon" /> Ciclo menstrual
                      </h2>
                      <p className="kpi-medium">
                        Ciclo: día {cicloFake.dia_actual} de{" "}
                        {cicloFake.duracion_ciclo} (estimado)
                      </p>
                    </div>
                  </div>

                  <CicloBar
                    dia={cicloFake.dia_actual}
                    total={cicloFake.duracion_ciclo}
                  />
                </div>

                <div className="card mini-card">
                  <div className="card-header-with-icon">
                    <div>
                      <h2 className="card-title">
                        <StressIcon className="card-icon" /> Estrés
                        (autoreportado)
                      </h2>
                      <p className="card-subtitle">Nivel percibido en consulta</p>
                      <p className="kpi-medium">Nivel: {stressFake.level} / 5</p>
                    </div>
                  </div>

                  <StressLevelBar value={stressFake.level} />
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header-with-icon">
                  <div>
                    <h2 className="card-title">
                      <StressIcon className="card-icon" /> Estrés (autoreportado)
                    </h2>
                    <p className="card-subtitle">Nivel percibido en consulta</p>
                    <p className="kpi-big">Nivel: {stressFake.level} / 5</p>
                  </div>
                </div>

                <StressLevelBar value={stressFake.level} />
              </div>
            )
          )}

          {prefs.eventos && showEventDetails && fusion?.glucose?.event_summary && (
            <div className="card events-expanded" style={{ flex: '0 0 100%', order: 9 }}>
              <div className="sheet-header">
                <h2 className="card-title">Detalle de eventos</h2>

                <button
                  className="sheet-close"
                  onClick={() => setShowEventDetails(false)}
                >
                  ×
                </button>
              </div>

              <div className="events-grid">
                <div className="event-block">
                  <h3>Hiper severa</h3>
                  <p>
                    Total:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hiper_severa.total_minutes
                    )}
                  </p>
                  <p>
                    Promedio:{" "}
                    {fusion.glucose.event_summary.hiper_severa.avg_minutes} min
                  </p>
                  <p>
                    Máximo:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hiper_severa.max_minutes
                    )}
                  </p>
                </div>

                <div className="event-block">
                  <h3>Hipoglucemia</h3>
                  <p>
                    Total:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hipo.total_minutes
                    )}
                  </p>
                  <p>
                    Promedio: {fusion.glucose.event_summary.hipo.avg_minutes}{" "}
                    min
                  </p>
                  <p>
                    Máximo:{" "}
                    {formatMinutes(
                      fusion.glucose.event_summary.hipo.max_minutes
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
            </section>

            {(prefs.grafica_glucosa || (prefs.glucosa && sheetLevel !== "collapsed")) && (
              <section className="dashboard-grid">
                {(prefs.grafica_glucosa || (prefs.glucosa && sheetLevel !== "collapsed")) && (
            <div className="card glucose-expanded">
              <div className="sheet-header">
           <h2 className="card-title">
  Glucosa (Ventana de 14 dias)
</h2>


                {!prefs.grafica_glucosa && (
                  <button
                    className="sheet-close"
                    onClick={() => setSheetLevel("collapsed")}
                  >
                    ×
                  </button>
                )}
              </div>

              {fusion?.glucose?.series?.length > 0 ? (
                <>
                  <GlucoseChart
                    data={fusion.glucose.series}
                    events={fusion.glucose.events}
                    filters={activeEventFilters}
                    onEventClick={setSelectedEvent}
                  />

                  {/* LEYENDA */}
                  <div className="glucose-legend">
                    {/* RANGOS */}
                    <div className="legend-group">
                      <span className="legend-group-title">Rangos</span>

                      <div className="legend-item">
                        <span className="legend-color green"></span>
                        <span>70–180 mg/dL</span>
                      </div>

                      <div className="legend-item">
                        <span className="legend-color red"></span>
                        <span>&lt; 70 mg/dL</span>
                      </div>

                      <div className="legend-item">
                        <span className="legend-color orange"></span>
                        <span>&gt; 180 mg/dL</span>
                      </div>
                    </div>

                    {/* EVENTOS */}
                    <div className="legend-group">
                      <span className="legend-group-title">Eventos</span>

                      <div
                        className={`legend-item ${
                          !activeEventFilters.hipo ? "disabled" : ""
                        }`}
                        onClick={() => toggleFilter("hipo")}
                      >
                        <span className="legend-color event-hypo"></span>
                        <span>Hipoglucemia</span>
                      </div>

                      <div
                        className={`legend-item ${
                          !activeEventFilters.hipo_severa ? "disabled" : ""
                        }`}
                        onClick={() => toggleFilter("hipo_severa")}
                      >
                        <span className="legend-color event-severe"></span>
                        <span>Hipo severa</span>
                      </div>

                      <div
                        className={`legend-item ${
                          !activeEventFilters.hiper_severa ? "disabled" : ""
                        }`}
                        onClick={() => toggleFilter("hiper_severa")}
                      >
                        <span className="legend-color event-hyper"></span>
                        <span>Hiper severa</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>No hay datos disponibles</p>
              )}
            </div>
          )}
              </section>
            )}
          </>
        )}
      </main>

      {showHbA1cModal && (
        <AddHbA1cModal
          patientId={pacienteId}
          onClose={() => setShowHbA1cModal(false)}
          onSaved={reloadManualEvents}
        />
      )}

      {showCustomizeModal && (
        <CustomizeDashboardModal
          currentPrefs={prefs}
          onClose={() => setShowCustomizeModal(false)}
          onSave={savePrefs}
        />
      )}
    </div>
  );
}

export default PatientDashboard;
