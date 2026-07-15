with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

# 1. Remove the original button
original_btn = """          <button
            type="button"
            className="btn btn-outline btn-round btn-md patient-add-btn"
            onClick={() => setShowHbA1cModal(true)}
          >
            + Agregar información
          </button>"""
content = content.replace(original_btn, "")

# 2. Replace the card title
old_title = """              <h2 className="card-title">
                <HbA1cIcon className="card-icon" /> HbA1c
              </h2>"""

new_title = """              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title" style={{ margin: 0 }}>
                  <HbA1cIcon className="card-icon" /> HbA1c
                </h2>
                <button
                  type="button"
                  onClick={() => setShowHbA1cModal(true)}
                  title="Agregar información"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e0e7ff',
                    color: '#4f46e5',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c7d2fe'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>"""

content = content.replace(old_title, new_title)

with open('src/pages/PatientDashboard.jsx', 'w') as f:
    f.write(content)

print("Patch successful!")
