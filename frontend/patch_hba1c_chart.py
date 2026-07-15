import re

with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

content = content.replace('<HbA1cChart data={hba1cHistory} />', '<HbA1cChart data={hba1cHistory.slice(-4)} />')

with open('src/pages/PatientDashboard.jsx', 'w') as f:
    f.write(content)

print("Patch applied for HbA1cChart")
