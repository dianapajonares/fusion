import re

with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

# 1. Add state variables at the top of the component
state_insertion_point = "const [showHbA1cModal, setShowHbA1cModal] = useState(false);"
new_states = """  const [showHbA1cModal, setShowHbA1cModal] = useState(false);
  const [isEditingHbA1cTarget, setIsEditingHbA1cTarget] = useState(false);
  const [tempHbA1cTarget, setTempHbA1cTarget] = useState("");"""

content = content.replace(state_insertion_point, new_states)

# 2. Add hba1cTarget variable derived from patient
hba1c_val_point = "const hba1cDate = latestHbA1cEvent?.timestamp ?? null;"
new_hba1c_vars = """const hba1cDate = latestHbA1cEvent?.timestamp ?? null;
  const hba1cTarget = patient?.dashboard_prefs?.meta_hba1c ?? 7.0;"""

content = content.replace(hba1c_val_point, new_hba1c_vars)

# 3. Add handleSaveHbA1cTarget function
func_insertion_point = "const reloadManualEvents = async () => {"
new_func = """  const handleSaveHbA1cTarget = async () => {
    try {
      const newPrefs = { ...(patient?.dashboard_prefs || {}), meta_hba1c: parseFloat(tempHbA1cTarget) };
      const res = await fetch(`http://127.0.0.1:8000/api/v1/pacientes/${pacienteId}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_prefs: newPrefs }),
        credentials: "include",
      });
      if (res.ok) {
        setIsEditingHbA1cTarget(false);
        setPatient({ ...patient, dashboard_prefs: newPrefs });
      }
    } catch (err) {
      console.error("Error updating hba1c target:", err);
    }
  };

  const reloadManualEvents = async () => {"""

content = content.replace(func_insertion_point, new_func)

# 4. Modify the card header to include the edit button and inline edit UI
# Since there are two instances, we'll use a regex sub or replace them identically.
old_card_header = """              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title" style={{ margin: 0 }}>
                  <HbA1cIcon className="card-icon" /> HbA1c
                </h2>
                <button
                  type="button"
                  className="card-action"
                  onClick={() => setShowHbA1cModal(true)}
                  title="Agregar información"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>"""

new_card_header = """              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="card-title" style={{ margin: 0 }}>
                    <HbA1cIcon className="card-icon" /> HbA1c
                  </h2>
                  <button
                    className="card-action"
                    style={{ width: '24px', height: '24px', background: 'transparent', color: '#9ca3af' }}
                    title="Editar meta de HbA1c"
                    onClick={() => {
                      setTempHbA1cTarget(hba1cTarget.toString());
                      setIsEditingHbA1cTarget(!isEditingHbA1cTarget);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  className="card-action"
                  onClick={() => setShowHbA1cModal(true)}
                  title="Agregar información"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {isEditingHbA1cTarget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#4b5563' }}>Nueva meta (%):</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={tempHbA1cTarget} 
                    onChange={(e) => setTempHbA1cTarget(e.target.value)}
                    style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
                  />
                  <button 
                    onClick={handleSaveHbA1cTarget}
                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer' }}
                  >Guardar</button>
                </div>
              )}"""

content = content.replace(old_card_header, new_card_header)

# 5. Modify the Chart call
old_chart = "<HbA1cChart data={hba1cHistory.slice(-4)} />"
new_chart = "<HbA1cChart data={hba1cHistory.slice(-4)} targetValue={hba1cTarget} />"

content = content.replace(old_chart, new_chart)

with open('src/pages/PatientDashboard.jsx', 'w') as f:
    f.write(content)

print("PatientDashboard patched successfully")
