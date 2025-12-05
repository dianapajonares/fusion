// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import PatientsList from "./pages/Pacients";
import PatientDashboard from "./pages/PatientDashboard";


function App() {
  return (
    <Routes>
      {/* Pantalla de inicio: LOGIN */}
      <Route path="/" element={<Login />} />

      {/* Lista de pacientes */}
      <Route path="/pacientes" element={<PatientsList />} />
      <Route path="/pacientes/:pacienteId" element={<PatientDashboard />} />


      {/* Cualquier otra ruta → al login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
