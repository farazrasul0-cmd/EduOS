
const GRADEBOOK = [
  { name: "Aarav Sharma",   roll: "7A-01", math: 92, sci: 88, eng: 84, hist: 79, avg: 86, grade: "A" },
  { name: "Priya Verma",    roll: "7A-02", math: 88, sci: 91, eng: 90, hist: 86, avg: 89, grade: "A" },
  { name: "Rohan Iyer",     roll: "7A-03", math: 64, sci: 58, eng: 62, hist: 70, avg: 64, grade: "C" },
  { name: "Maya Krishnan",  roll: "7A-04", math: 95, sci: 96, eng: 93, hist: 92, avg: 94, grade: "A+" },
  { name: "Kabir Singh",    roll: "7A-05", math: 76, sci: 72, eng: 80, hist: 74, avg: 75, grade: "B" },
  { name: "Ishita Patel",   roll: "7A-06", math: 84, sci: 86, eng: 88, hist: 82, avg: 85, grade: "A" },
  { name: "Dev Mehta",      roll: "7A-07", math: 71, sci: 75, eng: 68, hist: 72, avg: 71, grade: "B" },
  { name: "Anika Banerjee", roll: "7A-08", math: 89, sci: 87, eng: 92, hist: 88, avg: 89, grade: "A" },
];
function GradePill({ g }) {
  const map = { "A+": ["#16A34A","#DCFCE7"], "A": ["#16A34A","#DCFCE7"], "B": ["#2F6FED","#EAF1FE"], "C": ["#D97706","#FEF3C7"], "D": ["#DC2626","#FEE2E2"] };
  const [c, t] = map[g] || ["#475569","#E5E7EB"];
  return <span style={{ background: t, color: c, fontWeight: 700, fontSize: 12, padding: "3px 8px", borderRadius: 6 }}>{g}</span>;
}
const MARK_ROSTER = [
  { name: "Aarav Sharma",   roll: "7A-01", marks: 18 },
  { name: "Priya Verma",    roll: "7A-02", marks: 17 },
  { name: "Rohan Iyer",     roll: "7A-03", marks: 11 },
  { name: "Maya Krishnan",  roll: "7A-04", marks: 20 },
  { name: "Kabir Singh",    roll: "7A-05", marks: 15 },
  { name: "Ishita Patel",   roll: "7A-06", marks: 17 },
  { name: "Dev Mehta",      roll: "7A-07", marks: 14 },
  { name: "Anika Banerjee", roll: "7A-08", marks: 18 },
];
const EXAMS_FOR_MARKS = [
  "Mid-term · Mathematics",
  "Surprise quiz · Science",
  "Unit test · English",
  "Unit test · History",
];
function EnterMarksTab() {
  const [exam, setExam] = React.useState(EXAMS_FOR_MARKS[0]);
  const total = 20;
  return (
    <>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, alignItems: "end" }}>
          <div className="field"><label>Exam</label>
            <select className="select" value={exam} onChange={e => setExam(e.target.value)}>
              {EXAMS_FOR_MARKS.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label>Class</label><select className="select"><option>7-A</option><option>7-B</option></select></div>
          <div className="field"><label>Total marks</label><input className="input" defaultValue="20" /></div>
        </div>
      </Card>
      <div style={{ height: 16 }} />
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Student</th><th>Roll</th><th className="num" style={{ width: 160 }}>Marks (of {total})</th><th style={{ width: 80 }}>Grade</th></tr></thead>
          <tbody>
            {MARK_ROSTER.map(s => {
              const pct = (s.marks / total) * 100;
              const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";
              return (
                <tr key={s.roll}>
                  <td><div className="av-row"><Avatar name={s.name} /><div style={{ fontWeight: 600 }}>{s.name}</div></div></td>
                  <td className="secondary">{s.roll}</td>
                  <td className="num">
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      <input className="input" type="number" defaultValue={s.marks} style={{ width: 72, textAlign: "right" }} />
                      <span style={{ color: "var(--fg-3)", fontSize: 12 }}>/ {total}</span>
                    </div>
                  </td>
                  <td><GradePill g={grade} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <Button variant="secondary" icon="save">Save draft</Button>
        <Button variant="primary" icon="send">Publish results</Button>
      </div>
    </>
  );
}
function PageResults() {
  const [tab, setTab] = React.useState("gradebook");
  const avg = Math.round(GRADEBOOK.reduce((a,g)=>a+g.avg,0) / GRADEBOOK.length);
  const top = GRADEBOOK.reduce((a,g)=>g.avg>a.avg?g:a, GRADEBOOK[0]);
  return (
    <div>
      <div className="page-head">
        <div><h1>Results</h1><div className="sub">Enter marks, see the gradebook, and share report cards with parents.</div></div>
        <div className="actions">
          <Button variant="secondary" icon="download">Export</Button>
          <Button variant="primary" icon="send">Share with parents</Button>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="trending-up"  label="Class average" value={avg + "%"} delta="+2 vs last term" deltaTone="up" />
        <KPI icon="award"        label="Top performer" value={top.name.split(" ")[0]} footer={top.avg + "% average"} />
        <KPI icon="circle-alert" label="Below 70%"     value="1 student" deltaTone="down" delta="needs support" />
        <KPI icon="file-text"    label="Reports drafted" value="0" footer="of 12 students" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Segmented value={tab} onChange={setTab} options={[
          { label: "Gradebook",    value: "gradebook" },
          { label: "Enter marks",  value: "marks" },
          { label: "Report cards", value: "reports" },
        ]} />
      </div>
      {tab === "marks" && <EnterMarksTab />}
      {tab === "gradebook" && (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Student</th><th className="num">Math</th><th className="num">Science</th><th className="num">English</th><th className="num">History</th><th className="num">Average</th><th>Grade</th></tr></thead>
            <tbody>
              {GRADEBOOK.map(g => (
                <tr key={g.roll}>
                  <td><div className="av-row"><Avatar name={g.name} /><div><div style={{ fontWeight: 600 }}>{g.name}</div><div className="secondary">{g.roll}</div></div></div></td>
                  <td className="num" style={{ color: g.math < 70 ? "var(--eduos-danger)" : "var(--fg-1)" }}>{g.math}</td>
                  <td className="num" style={{ color: g.sci  < 70 ? "var(--eduos-danger)" : "var(--fg-1)" }}>{g.sci}</td>
                  <td className="num" style={{ color: g.eng  < 70 ? "var(--eduos-danger)" : "var(--fg-1)" }}>{g.eng}</td>
                  <td className="num" style={{ color: g.hist < 70 ? "var(--eduos-danger)" : "var(--fg-1)" }}>{g.hist}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{g.avg}</td>
                  <td><GradePill g={g.grade} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "reports" && (
        <Card><Empty icon="file-text" title="No report cards yet"
          sub="Once you've published exams for the term, EduOS will compile report cards you can share with parents."
          action={<Button variant="primary" icon="plus">Generate term 1 report</Button>} /></Card>
      )}
    </div>
  );
}
window.PageResults = PageResults;
