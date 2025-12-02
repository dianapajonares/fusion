import React, { useState } from "react";
import "../layout/DashboardLayout.css";
import { TopBarTabs } from "../components/MainLayout.jsx";


import { useNavigate } from "react-router-dom";

const MOCK_PATIENTS = [
  { id: 1, nombre: "Juan Pérez", edad: 35 },
  { id: 2, nombre: "Ana López", edad: 28 },
  { id: 3, nombre: "Carlos Ruiz", edad: 42 },
];

function PatientsList() {
  const [activeSection, setActiveSection] = useState("pacientes");
  const navigate = useNavigate();

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    // Aquí podrías hacer navigate según tu routing real:
    // if (sectionId === "inicio") navigate("/");
    // if (sectionId === "fusion") navigate("/fusion");
  };

  const handleViewPatient = (patientId) => {
    console.log("Ver información de paciente:", patientId);
    // Ejemplo de navegación al dashboard del paciente:
    // navigate(`/pacientes/${patientId}`);
  };

  return (
    <div className="app-root">
      <TopBarTabs
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userName="Doctor Hernandez"
      />

      <main className="patients-main">
        <section className="patients-card" aria-labelledby="patients-title">
          <h1 id="patients-title" className="patients-title">
            Pacientes
          </h1>

          <div className="patients-table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Edad</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PATIENTS.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.edad}</td>
                    <td>
                      <button
                        type="button"
                        className="patients-action-btn"
                        onClick={() => handleViewPatient(p.id)}
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
