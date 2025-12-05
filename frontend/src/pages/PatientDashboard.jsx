// src/pages/PatientDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../layout/Dashboard.css";
import { TopBarTabs } from "../components/TopBar.jsx";
import { TiempoEnRangosCard } from "../components/TiempoEnRangosCard.jsx";
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

// helper para formatear fechas que vienen del backend (ISO)
const formatDate = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

function PatientDashboard() {
  const { pacienteId } = useParams(); // ruta: /pacientes/:pacienteId
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("inicio");
  const [fusion, setFusion] = useState(null);
  const [patient, setPatient] = useState(null); // datos del paciente
  const [loading, setLoading] = useState(true);
  const [showPatientInfo, setShowPatientInfo] = useState(false);

  const patientHeaderRef = useRef(null); // para detectar click afuera

  // =========================
  //   Cargar datos de fusión + paciente
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fusionRes, patientRes] = await Promise.all([
          fetch(
            `http://127.0.0.1:8000/api/v1/fusion/${pacienteId}/fusion?days=14`,
            {
              credentials: "include",
            }
          ),
          fetch(`http://127.0.0.1:8000/api/v1/pacientes/${pacienteId}`, {
            credentials: "include",
          }),
        ]);

        // si cualquiera responde 401 -> sacar al login
        if (fusionRes.status === 401 || patientRes.status === 401) {
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
      } catch (err) {
        console.error("Error en fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pacienteId, navigate]);

  // =========================
  //   Cerrar popover al hacer click fuera
  // =========================
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

  // =========================
  //   Botón "Agregar información"
  // =========================
  const handleAgregarInfo = () => {
    console.log("Agregar información para el paciente", pacienteId);
    // ejemplo:
    // navigate(`/pacientes/${pacienteId}/agregar-info`);
  };

  // =========================
  //   Navegación del menú
  // =========================
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
      <div className="dashboard-loading">
        Cargando datos del paciente...
      </div>
    );
  }

  if (!fusion) {
    return (
      <div className="dashboard-loading">
        No se encontraron datos de fusión para este paciente.
      </div>
    );
  }

  // =========================
  //   Valores derivados
  // =========================
  const avgGlucose = fusion.glucose?.avg ?? null;
  const tirPercent = fusion.glucose?.tir_percent ?? null;
  const totalInsulin = fusion.insulin?.total ?? null;
  const dietEvents = fusion.diet?.events ?? 0;
  const avgKcalPerDay = fusion.diet?.avg_kcal_per_day ?? null;
  const totalKcal = fusion.diet?.total_kcal ?? 0;

  // Periodo legible
  let periodoLabel = "";
  if (fusion.range?.start && fusion.range?.end) {
    const start = new Date(fusion.range.start);
    const end = new Date(fusion.range.end);
    periodoLabel = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  } else {
    periodoLabel = "Últimos 14 días";
  }

  // Si ya tenemos al paciente, usamos su nombre real
  const patientName = patient
    ? `${patient.nombre} ${patient.apellido_paterno ?? ""} ${
        patient.apellido_materno ?? ""
      }`.trim()
    : `Paciente ${pacienteId}`;

  return (
    <div className="app-root">
      {/* TOPBAR / MENÚ */}
      <TopBarTabs
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userName="Doctor Hernández"
      />

      <main className="dashboard-main">
        {/* CABECERA PACIENTE */}
        <header className="dashboard-header" ref={patientHeaderRef}>
          {/* IZQUIERDA: chip + panel */}
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
                  Periodo: {periodoLabel}
                </span>
              </div>

              <ExpandMoreIcon
                className={`chip-arrow ${
                  showPatientInfo ? "rotated" : ""
                }`}
              />
            </button>

            {showPatientInfo && (
              <div className="patient-info-panel">
                <p className="patient-info-row">
                  <span>Fecha de nacimiento:</span>
                  <strong>{formatDate(patient?.fecha_nacimiento)}</strong>
                </p>
                <p className="patient-info-row">
                  <span>Tiempo CGM Activo:</span>
                  {/* por ahora sigue siendo placeholder */}
                  <strong>100%</strong>
                </p>
                <p className="patient-info-row">
                  <span>Diagnóstico desde:</span>
                  <strong>{patient?.anio_diagnostico ?? "—"}</strong>
                </p>
                <p className="patient-info-row">
                  <span>Enfermedades crónicas:</span>
                  <strong>{patient?.enfermedades_cronicas || "—"}</strong>
                </p>
              </div>
            )}
          </div>

          {/* DERECHA: nuevo botón, usando sistema global de botones */}
          <button
            type="button"
            className="btn btn-outline btn-round btn-md patient-add-btn"
            onClick={handleAgregarInfo}
          >
            + Agregar información
          </button>
        </header>

        {/* FILA SUPERIOR */}
        <section className="dashboard-grid-top">
          {/* TARJETA GRANDE AGRUPADA */}
          <div className="card-group">
            <TiempoEnRangosCard tir={fusion.glucose?.tir} />

            <div className="subcard">
              <h2 className="card-title">Métricas de Glucosa</h2>

              <div className="metrics-list">
                <div className="metric-row">
                  <div className="metric-left">
                    <p className="metric-title">Glucosa promedio</p>
                    <p className="metric-helper">
                      Objetivo: &lt;154 mg/dL
                    </p>
                  </div>
                  <p className="metric-value">
                    {avgGlucose !== null
                      ? `${avgGlucose.toFixed(2)} mg/dL`
                      : "—"}
                  </p>
                </div>
                <div className="metric-row">
                  <div className="metric-left">
                    <p className="metric-title">
                      Indicador de gestión de glucosa (GMI)
                    </p>
                    <p className="metric-helper">Objetivo: &lt;7%</p>
                  </div>
                  <p className="metric-value">1.48%</p>
                </div>

                <div className="metric-row">
                  <div className="metric-left">
                    <p className="metric-title">Variabilidad de la glucosa</p>
                    <p className="metric-helper">
                      Porcentaje de coeficiente de variación
                      <br />
                      Objetivo: &lt; 36%
                    </p>
                  </div>
                  <p className="metric-value">45.5%</p>
                </div>
              </div>
            </div>
          </div>

          {/* HbA1c */}
          <div className="card">
            <h2 className="card-title">
              <HbA1cIcon className="card-icon" /> HbA1c
            </h2>
            <p className="card-subtitle">Hemoglobina glicosilada</p>
            <p className="kpi-big">240 mg/dl</p>
            <div className="chart-placeholder">Gráfica (placeholder)</div>
          </div>

          {/* Dosis insulina */}
          <div className="card">
            <h2 className="card-title">
              <InsulinIcon className="card-icon" /> Dosis insulina
            </h2>
            <p className="card-subtitle"> </p>
            <p className="kpi-big">
              {totalInsulin !== null ? `${totalInsulin.toFixed(0)} UI` : "—"}
            </p>
            <div className="chart-placeholder">Gráfica (placeholder)</div>
          </div>
        </section>

        {/* FILA INFERIOR */}
        <section className="dashboard-grid-bottom">
          {/* Ingesta energética */}
          <div className="card">
            <div className="card-header-with-icon">
              <div>
                <CarbsIcon className="card-icon" />
                <h3 className="card-title">Ingesta energética</h3>
                <p className="card-subtitle">
                  Promedio diario (kcal) en el periodo
                </p>
              </div>
            </div>
            <p className="kpi-medium">
              {avgKcalPerDay !== null
                ? `${avgKcalPerDay.toFixed(0)} kcal`
                : "—"}
            </p>
            <p className="card-subtitle">
              Total en el periodo: {dietEvents} registros
            </p>
          </div>

          <div className="card">
            <div className="card-header-with-icon">
              <ActivityIcon className="card-icon" />
              <div>
                <h3 className="card-title">Actividad física</h3>
                <p className="card-subtitle">Promedio</p>
              </div>
            </div>
            <p className="kpi-medium">—</p>
          </div>

          <div className="card">
            <div className="card-header-with-icon">
              <SleepIcon className="card-icon" />
              <div>
                <h3 className="card-title">Sueño</h3>
                <p className="card-subtitle">Promedio</p>
              </div>
            </div>
            <p className="kpi-medium">—</p>
          </div>

          <div className="card">
            <div className="card-header-with-icon">
              <CycleIcon className="card-icon" />
              <div>
                <h3 className="card-title">Ciclo menstrual</h3>
                <p className="card-subtitle">ciclo: — días</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header-with-icon">
              <StressIcon className="card-icon" />
              <div>
                <h3 className="card-title">Estrés</h3>
                <p className="card-subtitle">Días reportados</p>
              </div>
            </div>
            <p className="kpi-small">—</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PatientDashboard;
