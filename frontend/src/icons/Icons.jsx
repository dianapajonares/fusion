// src/icons/Icons.jsx

import React from "react";

/**
 * Componente base para cualquier Material Symbol.
 * variant: "outlined" | "rounded" | "sharp"
 */
export function Icon({ name, variant = "outlined", className = "", style = {} }) {
  const baseClass =
    variant === "rounded"
      ? "material-symbols-rounded"
      : variant === "sharp"
      ? "material-symbols-sharp"
      : "material-symbols-outlined";

  return (
    <span className={`${baseClass} ${className}`} style={style}>
      {name}
    </span>
  );
}

/* ============ ICONOS SEMÁNTICOS PARA TU DASHBOARD ============ */

// Paciente / cabecera
export function PatientIcon(props) {
  return <Icon name="patient_list" {...props} />;
}

export function ExpandMoreIcon(props) {
  return <Icon name="expand_more" {...props} />;
}

// Glucosa / métricas
export function GlucoseIcon(props) {
  return <Icon name="monitor_heart" {...props} />;
}

// HbA1c
export function HbA1cIcon(props) {
  return <Icon name="bloodtype" {...props} />;
}

// Insulina
export function InsulinIcon(props) {
  return <Icon name="vaccines" {...props} />;
}

// Carbohidratos
export function CarbsIcon(props) {
  return <Icon name="restaurant" {...props} />;
}

// Actividad física
export function ActivityIcon(props) {
  return <Icon name="directions_run" {...props} />;
}

// Sueño
export function SleepIcon(props) {
  return <Icon name="hotel" {...props} />;
}

// Ciclo menstrual
export function CycleIcon(props) {
  return <Icon name="female" {...props} />;
}

// Estrés
export function StressIcon(props) {
  return <Icon name="psychology" {...props} />;
}

// Notas clínicas
export function ClinicalNotesIcon(props) {
  return <Icon name="clinical_notes" {...props} />;
}
