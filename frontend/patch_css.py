import re

with open('src/layout/Tarjetas.css', 'r') as f:
    content = f.read()

old_css = """.card-action {
  width: 32px;
  height: 32px;
  border-radius: 8px; /* ya no círculo, más acorde a cards */
  background: transparent;
  color: #00376F;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color .2s ease, transform .05s ease;
}

.card-action:hover {
  background-color: #F1F5F9;
}

.card-action:active {
  transform: scale(0.95);
}"""

new_css = """.card-action {
  width: 32px;
  height: 32px;
  border-radius: 8px; /* Cuadrado redondeado moderno */
  background-color: #e0e7ff;
  color: #4f46e5;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color .2s ease, transform .05s ease;
}

.card-action:hover {
  background-color: #c7d2fe;
}

.card-action:active {
  transform: scale(0.95);
}"""

if old_css in content:
    content = content.replace(old_css, new_css)
    with open('src/layout/Tarjetas.css', 'w') as f:
        f.write(content)
    print("CSS Updated")
else:
    print("Old CSS not found")
