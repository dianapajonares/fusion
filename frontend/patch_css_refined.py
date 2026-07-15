import re

with open('src/layout/DashboardLayout.css', 'r') as f:
    content = f.read()

# We need to replace the entire CSS block from "/* ====== Expanded Patient Panel ====== */" to the end.
pattern = r'/\* ====== Expanded Patient Panel ====== \*/.*'
new_css = """/* ====== Expanded Patient Panel ====== */
.expanded-patient-panel {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 24px;
  margin-top: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
  position: relative;
  width: 100%;
  box-sizing: border-box;
  animation: slideDownFade 0.3s ease;
}

@keyframes slideDownFade {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.epp-column {
  display: flex;
  flex-direction: column;
  gap: 24px; /* Space between subsections */
  flex: 1;
  padding: 0 16px;
}

.epp-col-general {
  flex: 1.2;
  padding-left: 0;
  gap: 16px; /* Tighter gap for the generic list */
}

.epp-divider {
  width: 1px;
  background-color: #e5e7eb;
  margin: 0 8px;
}

/* Sub-sections within columns */
.epp-sub-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Icons & Titles */
.epp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.epp-title-icon {
  width: 18px;
  height: 18px;
  color: #6b7280;
}

.epp-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

/* Rows & Data */
.epp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.epp-prop {
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
}

.epp-stat {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.epp-normal {
  color: #374151;
}

.epp-neutral {
  color: #6b7280;
}

.epp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.epp-dot-green {
  background-color: #10b981;
}

.epp-dot-gray {
  background-color: transparent;
  border: 2px solid #d1d5db;
  box-sizing: border-box;
}

.epp-stat-val {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.epp-unit {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  margin-left: 2px;
}

/* Column 1 Specific (Vertical list of items) */
.epp-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.epp-icon {
  width: 18px;
  height: 18px;
  color: #6b7280;
  margin-top: 2px;
  flex-shrink: 0;
}

.epp-data {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.epp-label {
  font-size: 13px;
  color: #6b7280;
}

.epp-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
  line-height: 1.4;
}

/* Bullets for Diseases and Meds */
.epp-bullets {
  margin: 4px 0 0 0;
  padding-left: 18px;
  color: #111827;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
}

.epp-bullets li {
  margin-bottom: 2px;
}
"""

content = re.sub(pattern, new_css, content, flags=re.DOTALL)

with open('src/layout/DashboardLayout.css', 'w') as f:
    f.write(content)
print("Updated CSS successfully.")
