// src/components/MainLayout.jsx
import React from "react";
import "../layout/DashboardLayout.css";
import "../layout/TopBar.css"

export function TopBarTabs({ activeSection, onSectionChange, userName }) {
  const sections = [
    { id: "inicio", label: "Inicio" },
    { id: "pacientes", label: "Pacientes" },
    { id: "fusion", label: "Fusión D1" },
  ];

  return (
    <header className="topbar">
      {/* Logo + nombre del sistema */}
      <div className="topbar-left">
        <div className="topbar-logo" aria-hidden="true">
          Hb
        </div>
        <span className="topbar-title">HbA1c</span>
      </div>

      {/* Tabs centrales */}
      <nav
        className="topbar-tabs"
        aria-label="Navegación principal"
        role="tablist"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={
              "topbar-tab-btn" +
              (activeSection === s.id ? " topbar-tab-btn--active" : "")
            }
            role="tab"
            aria-selected={activeSection === s.id}
            onClick={() => onSectionChange(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Menú de usuario */}
      <div className="topbar-right">
        <button
          type="button"
          className="user-menu-btn"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <span className="user-avatar" aria-hidden="true">
            {userName?.charAt(0) || "D"}
          </span>
          <span className="user-name">{userName}</span>
          <span className="user-chevron" aria-hidden="true">
            ▾
          </span>
        </button>
      </div>
    </header>
  );
}
