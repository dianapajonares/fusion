import re

with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

# Pattern to find the expanded panel section
panel_pattern = r'(\{showPatientInfo && \(\s*<div className="expanded-patient-panel">.*?</div\>\s*\)\})'
match = re.search(panel_pattern, content, flags=re.DOTALL)
if match:
    old_panel = match.group(1)

    new_panel = """{showPatientInfo && (() => {
          // Helper: calculate age
          let ageText = "";
          if (patient?.fecha_nacimiento) {
            const birthDate = new Date(patient.fecha_nacimiento);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            ageText = ` (${age} años)`;
          }

          // Helper: format chronic diseases into array
          const rawDiseases = patient?.enfermedades_cronicas || "Diabetes tipo 1 desde los 12 años. Hipotiroidismo autoinmune.";
          const diseaseList = rawDiseases.split('.').map(d => d.trim()).filter(d => d.length > 0);

          return (
            <div className="expanded-patient-panel">
              {/* Column 1: Datos Generales */}
              <div className="epp-column epp-col-general">
                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Fecha de nacimiento:</span>
                    <strong className="epp-value">{formatDate(patient?.fecha_nacimiento) || "12 mar 1998"}{ageText}</strong>
                  </div>
                </div>

                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Tiempo CGM Activo:</span>
                    <strong className="epp-value">100%</strong>
                  </div>
                </div>

                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Diagnóstico desde:</span>
                    <strong className="epp-value">{patient?.anio_diagnostico || "2010"}</strong>
                  </div>
                </div>

                <div className="epp-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="epp-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <div className="epp-data">
                    <span className="epp-label">Enfermedades crónicas:</span>
                    <ul className="epp-bullets">
                      {diseaseList.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="epp-divider"></div>

              {/* Column 2: Complicaciones + Nefropatía */}
              <div className="epp-column epp-col-middle">
                {/* Complicaciones */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <h3 className="epp-title">Complicaciones</h3>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">Retinopatía</span>
                    <span className="epp-stat epp-normal"><span className="epp-dot epp-dot-green"></span>Normal</span>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">Neuropatía</span>
                    <span className="epp-stat epp-neutral"><span className="epp-dot epp-dot-gray"></span>No evaluado</span>
                  </div>
                </div>

                {/* Nefropatía */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21c-5-5-5-10-5-10V5h10v6s0 5-5 10z" />
                    </svg>
                    <h3 className="epp-title">Nefropatía</h3>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">eGFR</span>
                    <strong className="epp-stat-val">92 <span className="epp-unit">mL/min/1.73m²</span></strong>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">Albúmina en orina</span>
                    <strong className="epp-stat-val">12 <span className="epp-unit">mg/g</span></strong>
                  </div>
                </div>
              </div>

              <div className="epp-divider"></div>

              {/* Column 3: Función Hepática + Medicamentos */}
              <div className="epp-column epp-col-right">
                {/* Función Hepática */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                    </svg>
                    <h3 className="epp-title">Función hepática</h3>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">ALT</span>
                    <strong className="epp-stat-val">22 <span className="epp-unit">U/L</span></strong>
                  </div>
                  <div className="epp-row">
                    <span className="epp-prop">AST</span>
                    <strong className="epp-stat-val">19 <span className="epp-unit">U/L</span></strong>
                  </div>
                </div>

                {/* Medicamentos */}
                <div className="epp-sub-section">
                  <div className="epp-header">
                    <svg xmlns="http://www.w3.org/2000/svg" className="epp-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <h3 className="epp-title">Medicamentos adicionales</h3>
                  </div>
                  <div className="epp-med-list">
                    <ul className="epp-bullets">
                      <li>Cortisona</li>
                      <li>Levotiroxina</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}"""

    content = content.replace(old_panel, new_panel)
    with open('src/pages/PatientDashboard.jsx', 'w') as f:
        f.write(content)
    print("Replaced panel successfully.")
else:
    print("Panel not found.")
