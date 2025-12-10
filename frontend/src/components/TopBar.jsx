// src/components/TopBarTabs.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../layout/TopBar.css";
import { UserIcon,ExpandMoreIcon } from "../icons/Icons.jsx";

const TABS = [
  { id: "home", label: "Inicio", path: "/" },
  { id: "patients", label: "Pacientes", path: "/pacientes" },
];

export function TopBarTabs() {
  const [activeTab, setActiveTab] = useState("home");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
          credentials: "include",
        });

        if (res.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        if (!res.ok) {
          console.error("Error consultando /auth/me");
          return;
        }

        const data = await res.json();
        // usamos nombre si viene, si no el username
        setDoctorName(data.nombre || data.username || "");
      } catch (err) {
        console.error("Error en fetch /auth/me:", err);
      }
    };

    fetchMe();
  }, [navigate]);

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

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error en logout:", error);
    }
  };

  const userLabel = doctorName || "Usuario";
  return (
    <header className="topbar">
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

      <div className="topbar-right">
        <div className="user-menu">
        <button
  className="topbar-btn user-btn"
  onClick={() => setShowUserMenu((prev) => !prev)}
>
  <UserIcon></UserIcon>
  {userLabel}
  <ExpandMoreIcon></ExpandMoreIcon>
</button>

          {showUserMenu && (
            <div className="user-dropdown">
              <button>Perfil</button>
              <button>Configuración</button>
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
