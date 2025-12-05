// src/components/TopBarTabs.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../layout/TopBar.css";

const TABS = [
  { id: "home", label: "Inicio", path: "/" },
  { id: "patients", label: "Pacientes", path: "/pacientes" },
];

export function TopBarTabs() {
  const [activeTab, setActiveTab] = useState("home");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };
  
  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("access_token");
  
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error en logout:", error);
    }
  };
  

  return (
    <header className="topbar">
      {/* Izquierda: logo + tabs */}
      <div className="topbar-left">
        <div className="topbar-logo">HbHbA1c</div>

        <nav className="topbar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`topbar-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Derecha: menú usuario */}
      <div className="topbar-right">
        <div className="user-menu">
          <button
            className="topbar-btn user-btn"
            onClick={() => setShowUserMenu((prev) => !prev)}
          >
            Doctor Hernández ▾
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <button>Perfil</button>
              <button>Configuración</button>
              <button onClick={handleLogout} >Cerrar sesión </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
