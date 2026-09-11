/* EduOS — Timetable: weekly grid of classes & periods */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PERIODS = [
  { p: "P1", time: "8:00 – 8:40" },
  { p: "P2", time: "8:45 – 9:25" },
  { p: "P3", time: "9:30 – 10:10" },
  { p: null, time: "Break"        },
  { p: "P4", time: "10:25 – 11:05"},
  { p: "P5", time: "11:10 – 11:50"},
  { p: "P6", time: "11:55 – 12:35"},
  { p: null, time: "Lunch"        },
  { p: "P7", time: "1:30 – 2:10"  },
  { p: "P8", time: "2:15 – 2:55"  },
];

const SUBJECT_COLORS = {
  Mathematics: ["#2F6FED", "#EAF1FE"],
  Science:     ["#16A34A", "#DCFCE7"],
  English:     ["#7C3AED", "#EDE9FE"],
  History:     ["#D97706", "#FEF3C7"],
  Geography:   ["#0891B2", "#CFFAFE"],
  Art:         ["#DB2777", "#FCE7F3"],
  PE:          ["#DC2626", "#FEE2E2"],
  Library:     ["#475569", "#E5E7EB"],
};

// 6 days × 10 rows. null = break/free.
const SCHEDULE = [
  // Mon
  ["7-A Math","8-A Math","7-B Math",null,"7-A Math","Free","8-B Math",null,"Mentor 7-A","Free"],
  // Tue
  ["7-B Math","Free","8-A Math",null,"7-A Math","8-B Math","Free",null,"7-A Math","Staff mtg"],
  // Wed
  ["7-A Math","8-A Math","8-B Math",null,"7-B Math","Free","7-A Math",null,"Free","Free"],
  // Thu
  ["Free","7-B Math","8-A Math",null,"7-A Math","8-B Math","Free",null,"Mentor 7-A","Free"],
  // Fri
  ["7-A Math","7-B Math","8-A Math",null,"8-B Math","Free","7-A Math",null,"Free","Lab 7-A"],
  // Sat
  ["7-A Math","Free","Free",null,"Free","Free","Free",null,"Free","Free"],
];

function periodCell(label) {
  if (!label || label === "Free") {
    return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-4)", fontSize: 12 }}>{label === "Free" ? "Free" : ""}</div>;
  }
  // parse "7-A Math" → class + subject
  const m = label.match(/^(\S+)\s+(.+)$/);
  let cls = "", subject = label;
  if (m) { cls = m[1]; subject = m[2]; }
  const subjectKey = ["Math","Maths","Mathematics"].includes(subject) ? "Mathematics" : subject;
  const [color, tint] = SUBJECT_COLORS[subjectKey] || ["#475569", "#F1F3F6"];
  return (
    <div style={{ background: tint, borderLeft: `3px solid ${color}`, height: "100%", padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: color, lineHeight: 1.2 }}>{cls || subject}</div>
      {cls && <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.2 }}>{subjectKey === "Mathematics" ? "Math" : subjectKey}</div>}
    </div>
  );
}

function PageTimetable() {
  const today = "Mon"; // for highlight
  const teaching = SCHEDULE[0].filter(s => s && s !== "Free").length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Timetable</h1>
          <div className="sub">Your weekly schedule · Term 2, 2025 – 26</div>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="printer">Print</Button>
          <Button variant="secondary" icon="download">Export</Button>
          <Button variant="primary" icon="pencil">Edit timetable</Button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="clock"        label="Teaching today"  value={`${teaching} periods`} footer="Mon, May 25" />
        <KPI icon="calendar"     label="Weekly load"     value="28 / 48"               delta="58%" deltaTone="up" footer="of available slots" />
        <KPI icon="users"        label="Classes"         value="4"                     footer="7-A · 7-B · 8-A · 8-B" />
        <KPI icon="bookmark"     label="Subjects"        value="Mathematics"           footer="primary subject" />
      </div>

      <Card title="Week of May 25 – 30, 2026"
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="icon-btn"><Icon name="chevron-left" size={16} /></button>
            <Button variant="secondary" size="sm" icon="calendar">This week</Button>
            <button className="icon-btn"><Icon name="chevron-right" size={16} /></button>
          </div>
        } pad={false}>
        <div style={{ overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px repeat(6, 1fr)", minWidth: 980 }}>
            {/* Header row */}
            <div style={{ background: "#FAFBFC", borderBottom: "1px solid var(--border-default)", padding: "10px 12px" }}></div>
            {DAYS.map(d => (
              <div key={d} style={{
                background: d === today ? "var(--eduos-primary-tint)" : "#FAFBFC",
                borderBottom: "1px solid var(--border-default)",
                borderLeft: "1px solid var(--divider-row)",
                padding: "10px 12px", textAlign: "center",
                fontWeight: 600, fontSize: 13,
                color: d === today ? "var(--eduos-primary)" : "var(--fg-2)",
              }}>
                {d} {d === today && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginLeft: 4 }}>· TODAY</span>}
              </div>
            ))}

            {/* Period rows */}
            {PERIODS.map((row, rIdx) => {
              const isBreak = row.p == null;
              return (
                <React.Fragment key={rIdx}>
                  <div style={{
                    background: isBreak ? "#FAFBFC" : "#FFF",
                    borderBottom: rIdx === PERIODS.length - 1 ? "none" : "1px solid var(--divider-row)",
                    padding: "8px 12px",
                    display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isBreak ? "var(--fg-3)" : "var(--fg-1)" }}>
                      {row.p || row.time}
                    </div>
                    {row.p && <div style={{ fontSize: 11, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{row.time}</div>}
                  </div>
                  {DAYS.map((d, dIdx) => (
                    <div key={d + rIdx} style={{
                      borderLeft: "1px solid var(--divider-row)",
                      borderBottom: rIdx === PERIODS.length - 1 ? "none" : "1px solid var(--divider-row)",
                      background: isBreak ? "#FAFBFC" : (d === today ? "rgba(234,241,254,0.35)" : "#FFF"),
                      height: 58,
                      padding: isBreak ? 0 : 0,
                    }}>
                      {isBreak
                        ? <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-4)", fontSize: 11, fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase" }}>{row.time}</div>
                        : periodCell(SCHEDULE[dIdx][rIdx])}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 16, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div className="t-micro">Subjects</div>
        {Object.entries(SUBJECT_COLORS).slice(0, 5).map(([s, [c, t]]) => (
          <div key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
            <span style={{ color: "var(--fg-2)" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.PageTimetable = PageTimetable;
