import { useState } from "react";

export default function BottomSheet() {
  const [level, setLevel] = useState("collapsed"); 
  // "collapsed" | "half" | "full"

  const toggle = () => {
    if (level === "collapsed") setLevel("half");
    else if (level === "half") setLevel("full");
    else setLevel("collapsed");
  };

  return (
    <div className={`sheet sheet-${level}`}>
      <div className="sheet-handle" onClick={toggle} />

      <div className="sheet-content">
        <h3>Glucosa por día</h3>

        <div className="days">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="day-card">
              Día {i + 1}
              <div className="fake-chart" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}