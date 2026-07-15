import re

with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

old_btn = """                <button
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
                >"""

new_btn = """                <button
                  type="button"
                  className="card-action"
                  onClick={() => setShowHbA1cModal(true)}
                  title="Agregar información"
                >"""

if old_btn in content:
    content = content.replace(old_btn, new_btn)
    with open('src/pages/PatientDashboard.jsx', 'w') as f:
        f.write(content)
    print("Inline styles removed")
else:
    print("Old inline style button not found")
