import React, { useState } from "react";
import "../../layout/DashboardLayout.css";

const SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "pacientes", label: "Pacientes" },
  { id: "fusion", label: "Fusión D1" },
];

export function TopBarTabs({ activeSection = "pacientes", onSectionChange, userName = "Doctor Hernandez" }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="topbar">
      {/* Lado izquierdo: logo + nombre app */}
      <div className="topbar-left">
        <div className="topbar-logo">
          <span className="topbar-logo-mark">β</span>
          <span className="topbar-logo-text">HbA1c</span>
        </div>
      </div>

      {/* Centro: pestañas */}
      <nav
        className="topbar-tabs"
        role="tablist"
        aria-label="Navegación principal"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            className={
              s.id === activeSection
                ? "topbar-tab topbar-tab--active"
                : "topbar-tab"
            }
            aria-selected={s.id === activeSection}
            onClick={() => onSectionChange && onSectionChange(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Derecha: usuario */}
      <div className="topbar-right">
        <div className="user-menu">
          <button
            type="button"
            className="user-trigger"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            <span className="user-name">{userName}</span>
            <span className="user-chevron">▾</span>
          </button>

          {userMenuOpen && (
            <ul className="user-dropdown" role="menu">
              <li role="menuitem">
                <button type="button">Perfil</button>
              </li>
              <li role="menuitem">
                <button type="button">Ajustes</button>
              </li>
              <li role="menuitem">
                <button type="button">Cerrar sesión</button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}

