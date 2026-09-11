
const EXAMS_LIST = [
  { name: "Mid-term · Mathematics",  date: "May 27", state: "Scheduled", cls: "7-A", students: 12, avg: null },
  { name: "Surprise quiz · Science", date: "May 29", state: "Draft",     cls: "7-A", students: 12, avg: null },
  { name: "Unit test · English",     date: "May 18", state: "Published", cls: "7-A", students: 12, avg: 78 },
  { name: "Unit test · History",     date: "May 11", state: "Published", cls: "7-A", students: 12, avg: 81 },
  { name: "Mid-term · Science",      date: "May 04", state: "Published", cls: "7-A", students: 12, avg: 74 },
];
function ExamStateBadge({ s }) {
  if (s === "Published") return <Badge tone="info">Published</Badge>;
  if (s === "Scheduled") return <Badge tone="warning">Scheduled</Badge>;
  return <Badge tone="neutral">Draft</Badge>;
}

/* --- Sub-tab: List --- */
function ExamsListTab() {
  const open = EXAMS_LIST.filter(e => e.state !== "Published").length;
  return (
    <>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="calendar"       label="Upcoming"   value={String(open)}  footer="next 14 days" />
        <KPI icon="file-edit"      label="Drafts"     value="1"             footer="not yet scheduled" />
        <KPI icon="check-circle"   label="Published"  value="3"             delta="this term" deltaTone="up" />
        <KPI icon="bar-chart-3"    label="Class avg." value="78%"           delta="+2 vs last term" deltaTone="up" />
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Exam</th><th>Class</th><th>Date</th><th>Students</th><th>Average</th><th>Status</th><th style={{ width: 120 }}></th></tr></thead>
          <tbody>
            {EXAMS_LIST.map((e, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{e.name}</td>
                <td>{e.cls}</td>
                <td>{e.date}</td>
                <td className="secondary">{e.students}</td>
                <td className="num" style={{ fontWeight: 600 }}>{e.avg != null ? e.avg + "%" : "—"}</td>
                <td><ExamStateBadge s={e.state} /></td>
                <td>{e.state === "Published" ? <Button variant="ghost" size="sm" icon="bar-chart-3">Analyze</Button> : <Button variant="ghost" size="sm" icon="pencil" onClick={() => { location.hash = "#results"; }}>Enter marks</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* --- Sub-tab: AI exam builder --- */
function AIBuilderTab() {
  const [subject, setSubject] = React.useState("Mathematics");
  const [grade, setGrade] = React.useState("7");
  const [difficulty, setDifficulty] = React.useState("Medium");
  const [count, setCount] = React.useState(10);
  const [topics, setTopics] = React.useState("Algebra · linear equations, word problems");
  const Qs = [
    { q: "Solve for x: 3x + 7 = 22", type: "Short answer", marks: 2, opts: null },
    { q: "If a train travels 240 km in 4 hours, what is its average speed?", type: "Multiple choice", marks: 2, opts: ["50 km/h","60 km/h","70 km/h","80 km/h"], correct: 1 },
    { q: "The sum of two consecutive integers is 47. Find the integers.", type: "Short answer", marks: 3, opts: null },
    { q: "Simplify: 4(x − 2) + 3(x + 5)", type: "Short answer", marks: 2, opts: null },
    { q: "A shopkeeper sells a pen for ₹120 at a 20% profit. Find the cost price.", type: "Long answer", marks: 4, opts: null },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
      <Card title="Exam settings">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field"><label>Subject</label>
            <select className="select" value={subject} onChange={e => setSubject(e.target.value)}>
              <option>Mathematics</option><option>Science</option><option>English</option><option>History</option>
            </select>
          </div>
          <div className="field"><label>Grade</label>
            <select className="select" value={grade} onChange={e => setGrade(e.target.value)}>
              {["6","7","8","9","10"].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label>Topics</label>
            <textarea className="textarea" value={topics} onChange={e => setTopics(e.target.value)} rows={3} />
            <span className="hint">Comma-separated. EduOS will spread questions across them.</span>
          </div>
          <div className="field"><label>Difficulty</label>
            <Segmented value={difficulty} onChange={setDifficulty} options={[
              { label: "Easy", value: "Easy" }, { label: "Medium", value: "Medium" }, { label: "Hard", value: "Hard" },
            ]} />
          </div>
          <div className="field"><label>Question count</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="range" min="5" max="30" step="1" value={count} onChange={e => setCount(+e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontWeight: 600, width: 28, textAlign: "right" }}>{count}</span>
            </div>
          </div>
          <Button variant="primary" icon="sparkles">Generate exam</Button>
        </div>
      </Card>
      <Card title="Draft · Mid-term Mathematics" sub={`Grade ${grade} · ${difficulty} · ${count} questions`}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="rotate-cw">Regenerate</Button>
          <Button variant="ghost" size="sm" icon="pencil">Edit</Button>
        </div>}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Badge tone="info">Algebra</Badge><Badge tone="info">Linear equations</Badge>
          <Badge tone="info">Word problems</Badge><Badge tone="neutral">Estimated · 45 min</Badge>
        </div>
        <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14, margin: 0 }}>
          {Qs.map((qn, i) => (
            <li key={i} style={{ border: "1px solid var(--divider-row)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ background: "var(--eduos-primary-tint)", color: "var(--eduos-primary)", borderRadius: 8, fontWeight: 700, fontSize: 13, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{qn.q}</div>
                  {qn.opts && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                      {qn.opts.map((o, j) => (
                        <label key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid " + (j === qn.correct ? "#16A34A" : "var(--border-default)"), borderRadius: 8, fontSize: 13, background: j === qn.correct ? "#F0FDF4" : "#FFF" }}>
                          <span style={{ width: 14, height: 14, border: "2px solid " + (j === qn.correct ? "#16A34A" : "var(--border-strong)"), borderRadius: "50%", background: j === qn.correct ? "#16A34A" : "transparent", display: "inline-block" }} />
                          {o}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <Badge tone="neutral">{qn.type}</Badge>
                  <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{qn.marks} marks</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function PageExams() {
  const [tab, setTab] = React.useState("list");
  return (
    <div>
      <div className="page-head">
        <div><h1>Exams</h1><div className="sub">Schedule exams and draft papers with AI. Marks are entered in Results.</div></div>
        <div className="actions">
          <Button variant="secondary" icon="file-down">Export PDF</Button>
          <Button variant="primary" icon="plus">New exam</Button>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Segmented value={tab} onChange={setTab} options={[
          { label: "All exams",     value: "list" },
          { label: "✨ AI builder", value: "ai" },
        ]} />
      </div>
      {tab === "list" && <ExamsListTab />}
      {tab === "ai"   && <AIBuilderTab />}
    </div>
  );
}
window.PageExams = PageExams;
