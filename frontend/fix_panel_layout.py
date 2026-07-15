import re

with open('src/pages/PatientDashboard.jsx', 'r') as f:
    content = f.read()

# The expanded-patient-panel is currently inside patient-header-group.
# We want to extract it and put it AFTER </header>

panel_pattern = r'(\{showPatientInfo && \(\s*<div className="expanded-patient-panel">.*?</div\>\s*\)\})'
match = re.search(panel_pattern, content, flags=re.DOTALL)
if match:
    panel_code = match.group(1)
    
    # Remove it from its current position
    content = content.replace(panel_code, "")
    
    # Now find </header> and insert it right after
    header_end = "</header>"
    if header_end in content:
        content = content.replace(header_end, f"</header>\n\n        {panel_code}\n")
        
        with open('src/pages/PatientDashboard.jsx', 'w') as f:
            f.write(content)
        print("Moved expanded panel successfully.")
    else:
        print("Could not find </header>")
else:
    print("Could not find expanded panel code.")
