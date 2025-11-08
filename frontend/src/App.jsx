// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx'; 
import DashboardPage from './pages/Dashboard.jsx';
import MainLayout from './components/MainLayout.jsx'; 

function App() {
  return (
    <div className="App">
      <Routes>
        
        {/* 🚨 RUTA DE LOGIN: Accesible en http://localhost:3000/login */}
        <Route path="/login" element={<Login />} />
        
        {/* 🟢 RUTA PRINCIPAL (DEFAULT): Accesible en http://localhost:3000/ */}
        {/* El Layout envuelve el contenido del Dashboard */}
        <Route path="/" element={<MainLayout> <DashboardPage /> </MainLayout>} />
        
        {/* Aquí puedes añadir más rutas que usen el MainLayout, ej: */}
        {/* <Route path="/pacientes" element={<MainLayout> <PacientesPage /> </MainLayout>} /> */}
        
      </Routes>
    </div>
  );
}

export default App;