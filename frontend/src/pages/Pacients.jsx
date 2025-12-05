import React, { useState, useEffect } from "react";
import "../layout/DashboardLayout.css";
import { TopBarTabs } from "../components/TopBar.jsx";
import { useNavigate } from "react-router-dom";

function PatientsList() {
  const [activeSection, setActiveSection] = useState("pacientes");
  const [patients, setPatients] = useState([]);
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
          credentials: "include",  // 👈 Manda la cookie access_token
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

        // Añadir campo edad calculado
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



  return (
    <div className="app-root">
      <TopBarTabs
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userName="Doctor Hernández"
      />

      <main className="patients-main">
        <section className="patients-card" aria-labelledby="patients-title">
          <h1 id="patients-title" className="patients-title">Pacientes</h1>

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
                {patients.map((p) => (
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
        </section>
      </main>
    </div>
  );
}

export default PatientsList;
