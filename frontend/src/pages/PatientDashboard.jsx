import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../layout/Dashboard.css";
import "../layout/Tarjetas.css";
import "../layout/PacienteHeader.css";
import "../layout/GlucosaCard.css";

import { AddHbA1cModal } from "../components/AddHbA1cModal.jsx";
import { TopBarTabs } from "../components/TopBar.jsx";
import { TiempoEnRangosCard } from "../components/TiempoEnRangosCard.jsx";
import { InfoTooltip } from "../components/InfoToolTip.jsx";
import { HbA1cChart } from "../components/HbA1Cchart.jsx";
import { CicloBar } from "../components/CicloBar.jsx";

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

  const patientHeaderRef = useRef(null);

  const [manualEvents, setManualEvents] = useState([]);
  const [showHbA1cModal, setShowHbA1cModal] = useState(false);

  const rawSexo = patient?.sexo ?? fusion?.patient?.sexo ?? "";
  const sexoNormalizado = rawSexo.toString().toLowerCase();
  const esMujer = ["female", "f", "mujer", "femenino"].includes(sexoNormalizado);

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

  const avgGlucose = fusion.glucose?.avg ?? null;
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
  const avgKcalPerDay =
  fusion.diet?.avg_kcal_per_day ?? 1850;

  const activityAvgMinutes =
  fusion.activity?.avg_minutes_per_day ?? 40; 

  const sleepAvgHours =
  fusion.sleep?.avg_hours_per_night ?? 7.2; 
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

          <button
            type="button"
            className="btn btn-outline btn-round btn-md patient-add-btn"
            onClick={() => setShowHbA1cModal(true)}
          >
            + Agregar información
          </button>
        </header>

        <section className="dashboard-grid-top">
          <div className="card card-group">
            <div className="group-item">
              <TiempoEnRangosCard tir={fusion.glucose?.tir} />
            </div>

            <div className="vertical-divider"></div>

            <div className="group-item">
              <div className="subcard-inner">
                <h2 className="card-title">Métricas de Glucosa</h2>
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
          </div>

          <div className="card">
            <h2 className="card-title">
              <HbA1cIcon className="card-icon" /> HbA1c
            </h2>
            <p className="card-subtitle">Hemoglobina glicosilada</p>

            <p className="kpi-big">
              {hba1cValue !== null ? `${hba1cValue.toFixed(1)} %` : "—"}
            </p>

            <p className="metric-subtitle">
              {hba1cDate
                ? `Última medición: ${formatDate(hba1cDate)}`
                : "Sin registro reciente"}
            </p>

            <HbA1cChart data={hba1cHistory} />
          </div>

          <div className="card">
            <h2 className="card-title">
              <InsulinIcon className="card-icon" /> Eventos relevantes
              <InfoTooltip>
                Total de episodios fuera de rango clínica durante el periodo. Se
                cuentan intervalos sostenidos, no lecturas aisladas
              </InfoTooltip>
            </h2>
            <p className="card-subtitle">Total en el perido</p>
            <div className="metric-row">
              <div className="metric-left">
                <p className="metric-title">Hiper severa</p>
                <p className="metric-subtitle">Rango: &gt; 250 mg/dL</p>
              </div>
              <p className="metric-right">
                {fusion?.glucose?.eventos?.hiper_severa ?? "—"}
              </p>
            </div>

            <div className="metrics-list">
              <div className="metric-row">
                <div className="metric-left">
                  <p className="metric-title">Hipoglucemias</p>
                  <p className="metric-subtitle">Rango: &lt; 70 mg/dL</p>
                </div>
                <p className="metric-right">
                  {fusion?.glucose?.eventos?.hipo ?? "—"}
                </p>
              </div>

              <div className="metric-row">
                <div className="metric-left">
                  <p className="metric-title">Hipo severa</p>
                  <p className="metric-subtitle">Rango: &lt; 54 mg/dL</p>
                </div>
                <p className="metric-right">
                  {fusion?.glucose?.eventos?.hipo_severa ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-grid-bottom">
          <div className="card">
            <h2 className="card-title">
              <InsulinIcon className="card-icon" /> Distribución de insulina
            </h2>
            <p className="card-subtitle">Total en el periodo</p>

            <div className="metrics-list">
              <div className="metric-row">
                <div className="metric-left">
                  <p className="metric-title">Dosis total diaria</p>
                  <p className="metric-helper">
                  Últimos 14 días                  </p>
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
                  <p className="metric-helper">
                    Ideal: 40–60% del total diario
                  </p>
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
                  <p className="metric-helper">Comidas y correcciones</p>
                </div>
                <p className="metric-value">
                  {insulinBolusRatio !== null
                    ? `${insulinBolusRatio.toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

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

<p className="card-subtitle">
  Referencia: ~2000 kcal/día 
</p>
          </div>

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
  {activityAvgMinutes ? `${activityAvgMinutes.toFixed(0)} min/día` : "—"}
</p>


<p className="card-subtitle">
  Recomendación: ≥ 45 min/día
</p>
          </div>

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

<p className="card-subtitle">
  Recomendación: 7–9 h/noche
</p>

          </div>

          {esMujer ? (
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
                      <StressIcon className="card-icon" /> Estrés (autoreportado)
                    </h2>
                    <p className="card-subtitle">
                      Nivel percibido en consulta
                    </p>
                    <p className="kpi-medium">
                      Nivel: {stressFake.level} / 5
                    </p>
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
                  <p className="kpi-big">
                    Nivel: {stressFake.level} / 5
                  </p>
                </div>
              </div>

              <StressLevelBar value={stressFake.level} />
            </div>
          )}
        </section>
      </main>

      {showHbA1cModal && (
        <AddHbA1cModal
          patientId={pacienteId}
          onClose={() => setShowHbA1cModal(false)}
          onSaved={reloadManualEvents}
        />
      )}
    </div>
  );
}

export default PatientDashboard;
