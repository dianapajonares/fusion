const fs = require('fs');
let content = fs.readFileSync('src/pages/PatientDashboard.jsx', 'utf8');

const target = `  const [startDate, setStartDate] = useState(() => {`;
const insertion = `
  const activeCardsTop = [prefs.glucosa || prefs.eventos, prefs.hba1c].filter(Boolean).length;
  const topGridColumns = activeCardsTop === 2 ? "4.1fr 1.4fr" : "1fr";

  const cardGroupColumns = (prefs.glucosa && prefs.eventos) 
    ? "1.3fr 1.2fr 1fr" 
    : (prefs.glucosa ? "1.3fr 1.2fr" : "1fr");

  const bottomCardsCount = [prefs.insulina, prefs.ingesta, prefs.actividad, prefs.sueno, prefs.estres_ciclo, prefs.eventos && showEventDetails && fusion?.glucose?.event_summary].filter(Boolean).length;
  const totalBottomCards = prefs.glucosa ? bottomCardsCount : bottomCardsCount + activeCardsTop;
  const bottomGridColumns = \`repeat(\${totalBottomCards || 1}, minmax(0, 1fr))\`;

`;

content = content.replace(target, insertion + target);
fs.writeFileSync('src/pages/PatientDashboard.jsx', content);
