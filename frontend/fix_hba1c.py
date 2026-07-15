with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

# Let's find the first instance using regex or just replace manually
import re

old_header_pattern = r'<div className="card-header-row" style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}>\s*<h2 className="card-title" style={{ margin: 0 }}>\s*<HbA1cIcon className="card-icon" /> HbA1c\s*</h2>\s*<button\s*type="button" class="btn-icon"\s*onClick=\{\(\) => setShowHbA1cModal\(true\)\}\s*title="Agregar información"\s*onMouseEnter=\{.*?\}\s*onMouseLeave=\{.*?\}\s*>\s*<svg.*?</svg>\s*</button>\s*</div>'

new_header = """              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

content = re.sub(old_header_pattern, new_header, content, flags=re.DOTALL)

with open('src/pages/PatientDashboard.jsx', 'w') as f:
    f.write(content)
print("Fixed missing pencil icon")
