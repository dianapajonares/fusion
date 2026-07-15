with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

# Replace the original card-header-row for Insulin
old_header = """              <div className="card-header-row">
                <h2 className="card-title">
                  <InsulinIcon className="card-icon" /> Distribución de insulina
                </h2>"""

new_header = """              <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 className="card-title" style={{ margin: 0, paddingRight: '8px' }}>
                  <InsulinIcon className="card-icon" /> Distribución de insulina
                </h2>"""

content = content.replace(old_header, new_header)

with open('src/pages/PatientDashboard.jsx', 'w') as f:
    f.write(content)

print("Patch applied")
