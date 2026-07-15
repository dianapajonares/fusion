import React, { useState, useEffect } from "react";
import "../layout/DashboardLayout.css";
import { TopBarTabs } from "../components/TopBar.jsx";
import { useNavigate } from "react-router-dom";

function PatientsList() {
  const [activeSection, setActiveSection] = useState("pacientes");
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Función auxiliar para calcular edad
  const calcularEdad = (fechaNacimiento) => {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Cargar pacientes desde el backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/v1/pacientes/", {
          method: "GET",
          credentials: "include", 
        });

        if (response.status === 401) {
          console.warn("No autenticado, redirigiendo a login");
          navigate("/", { replace: true });
          return;
        }

        if (!response.ok) {
          console.error("Error al cargar pacientes", response.status);
          return;
        }

        const data = await response.json();

        const pacientesConEdad = data.map((p) => ({
          ...p,
          edad: calcularEdad(p.fecha_nacimiento),
        }));

        setPatients(pacientesConEdad);
      } catch (error) {
        console.error("Error en fetchPatients:", error);
      }
    };

    fetchPatients();
  }, [navigate]);

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleViewPatient = (patientId) => {
    console.log("Ver información de paciente:", patientId);
      navigate(`/pacientes/${patientId}`);
   
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(query) ||
      p.apellido_paterno?.toLowerCase().includes(query) ||
      p.apellido_materno?.toLowerCase().includes(query) ||
      p.historia_clinica_num?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="app-root">
      <TopBarTabs
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userName="Doctor Hernández"
      />

      <main className="patients-main">
        <section className="patients-card" aria-labelledby="patients-title">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h1 id="patients-title" className="patients-title" style={{ margin: 0, textAlign: 'left' }}>Pacientes</h1>
              <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                {patients.length} pacientes registrados
              </span>
            </div>
            <div className="patients-search-wrapper">
              <svg className="patients-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="patients-search-input"
                placeholder="Buscar por nombre, apellido o expediente"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredPatients.length > 0 ? (
            <div className="patients-table-wrapper">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>
                      Expediente<br />
                      <span className="th-subtitle">Número</span>
                    </th>

                    <th>
                      Apellido<br />
                      <span className="th-subtitle">Paterno</span>
                    </th>

                    <th>
                      Apellido<br />
                      <span className="th-subtitle">Materno</span>
                    </th>

                    <th>
                      Nombre<br />
                      <span className="th-subtitle">Paciente</span>
                    </th>

                    <th>
                      Edad<br />
                      <span className="th-subtitle">Años</span>
                    </th>

                    <th>
                      Acción<br />
                      <span className="th-subtitle">Detalles</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.paciente_id}>
                      <td>{p.historia_clinica_num}</td>
                      <td>{p.apellido_paterno}</td>
                      <td>{p.apellido_materno ?? "—"}</td>
                      <td>{p.nombre}</td>
                      <td>{p.edad}</td>
                      <td>
                        <button
                          type="button"
                          className="patients-action-btn"
                          onClick={() => handleViewPatient(p.paciente_id)}
                        >
                          Ver información
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="patients-empty-state">
              <div className="patients-empty-icon">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="patients-empty-text">No se encontraron pacientes. Intenta con otro nombre o ajusta los filtros.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PatientsList;
