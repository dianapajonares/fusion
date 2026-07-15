import re

file_path = "src/pages/PatientDashboard.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Update columns logic
old_cols_logic = """  const bottomCardsCount = [prefs.insulina, prefs.ingesta, prefs.actividad, prefs.sueno, prefs.estres_ciclo].filter(Boolean).length;
  const bottomGridColumns = `repeat(${bottomCardsCount || 1}, minmax(0, 1fr))`;"""

new_cols_logic = """  const bottomCardsCount = [prefs.insulina, prefs.ingesta, prefs.actividad, prefs.sueno, prefs.estres_ciclo, prefs.eventos && showEventDetails && fusion?.glucose?.event_summary].filter(Boolean).length;
  const totalBottomCards = prefs.glucosa ? bottomCardsCount : bottomCardsCount + activeCardsTop;
  const bottomGridColumns = `repeat(${totalBottomCards || 1}, minmax(0, 1fr))`;"""

content = content.replace(old_cols_logic, new_cols_logic)

# 2. Find the start of the <section className="dashboard-flex-layout">
start_idx = content.find('<section className="dashboard-flex-layout">')
end_idx = content.find('</main>', start_idx)

section_content = content[start_idx:end_idx]

# Inside section_content, we need to extract TopCards, ExpandedChart, and BottomCards.
# Top cards ends at the start of ExpandedChart which is {(prefs.grafica_glucosa
expanded_chart_start = section_content.find('{(prefs.grafica_glucosa')
top_cards_jsx = section_content[len('<section className="dashboard-flex-layout">'):expanded_chart_start].strip()

# ExpandedChart ends at {prefs.insulina && (
bottom_cards_start = section_content.find('{prefs.insulina && (')
expanded_chart_jsx = section_content[expanded_chart_start:bottom_cards_start].strip()

# BottomCards ends before </section>
bottom_cards_jsx = section_content[bottom_cards_start:section_content.rfind('</section>')].strip()

# Create the new render logic
new_render_logic = f"""
        {{prefs.glucosa ? (
          <>
            <section className="dashboard-grid-top" style={{{{ gridTemplateColumns: topGridColumns }}}}>
              {top_cards_jsx}
            </section>
            
            {{(prefs.grafica_glucosa || (prefs.glucosa && sheetLevel !== "collapsed")) && (
              <section className="dashboard-grid">
                {expanded_chart_jsx}
              </section>
            )}}

            <section className="dashboard-grid-bottom" style={{{{ gridTemplateColumns: bottomGridColumns }}}}>
              {bottom_cards_jsx}
            </section>
          </>
        ) : (
          <>
            <section className="dashboard-grid-bottom" style={{{{ gridTemplateColumns: bottomGridColumns }}}}>
              {top_cards_jsx}
              {bottom_cards_jsx}
            </section>

            {{(prefs.grafica_glucosa || (prefs.glucosa && sheetLevel !== "collapsed")) && (
              <section className="dashboard-grid">
                {expanded_chart_jsx}
              </section>
            )}}
          </>
        )}}
"""

# Replace the old section
new_content = content[:start_idx] + new_render_logic.strip() + "\n      " + content[end_idx:]

with open(file_path, "w") as f:
    f.write(new_content)
print("Refactor complete.")
