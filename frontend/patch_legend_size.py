import re

with open('src/layout/GlucosaCard.css', 'r') as f:
    content = f.read()

# Make glucose-legend text larger
content = content.replace("font-size: 12px;\n    color: #6b7280;", "font-size: 14px;\n    color: #4b5563;")

# Make legend-group-title larger
content = content.replace("font-size: 12px;\n    color: #374151;", "font-size: 15px;\n    color: #111827;")

# Make the color boxes larger
content = content.replace("width: 10px;\n    height: 10px;", "width: 14px;\n    height: 14px;")

# Increase gap between items for better breathing room
content = content.replace("gap: 12px;", "gap: 16px;")
content = content.replace("gap: 6px;", "gap: 8px;")

with open('src/layout/GlucosaCard.css', 'w') as f:
    f.write(content)
print("Sized up the legend successfully.")
