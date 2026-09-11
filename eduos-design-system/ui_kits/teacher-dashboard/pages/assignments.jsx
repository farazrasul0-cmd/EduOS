/* EduOS — Assignments
   Two views: list, and one-assignment detail (submissions tracker).
*/

const ASSIGNMENTS = [
  { id:"A-104", title:"Algebra · Worksheet 4",            subject:"Mathematics", cls:"7-A", due:"Wed, May 27 · 11:59 PM", assigned:"Mon, May 25", points:20, state:"Open",   submitted:8,  graded:3,  total:12 },
  { id:"A-103", title:"Science · Lab report — Acids & bases", subject:"Science", cls:"7-A", due:"Fri, May 30 · 6:00 PM",  assigned:"Wed, May 20", points:30, state:"Open",   submitted:5,  graded:0,  total:12 },
  { id:"A-102", title:"English · Book review (300 words)",    subject:"English", cls:"7-A", due:"Mon, May 18 · 11:59 PM", assigned:"Mon, May 11", points:15, state:"Closed", submitted:12, graded:12, total:12 },
  { id:"A-101", title:"History · Mughal empire timeline",     subject:"History", cls:"7-A", due:"Fri, May 09 · 11:59 PM", assigned:"Mon, May 05", points:20, state:"Closed", submitted:11, graded:11, total:12 },
  { id:"A-100", title:"Mathematics · Algebra worksheet 3",    subject:"Mathematics", cls:"7-A", due:"Mon, May 04 · 11:59 PM", assigned:"Mon, Apr 27", points:20, state:"Closed", submitted:12, graded:12, total:12 },
  { id:"DRAFT-1", title:"Mathematics · Geometry — angles practice", subject:"Mathematics", cls:"7-A", due:"—", assigned:"—", points:15, state:"Draft", submitted:0, graded:0, total:12 },
];

const ASN_ROSTER = [
  { name:"Aarav Sharma",   roll:"7A-01", status:"graded",      grade:18, late:false, when:"May 26, 7:14 PM",   file:"aarav-ws4.pdf" },
  { name:"Priya Verma",    roll:"7A-02", status:"submitted",   grade:null, late:false, when:"May 26, 9:42 PM", file:"priya-ws4.pdf" },
  { name:"Rohan Iyer",     roll:"7A-03", status:"missing",     grade:null, late:false, when:null, file:null },
  { name:"Maya Krishnan",  roll:"7A-04", status:"graded",      grade:20, late:false, when:"May 26, 4:08 PM",   file:"maya-ws4.pdf" },
  { name:"Kabir Singh",    roll:"7A-05", status:"submitted",   grade:null, late:false, when:"May 27, 8:01 AM", file:"kabir-ws4.jpg" },
  { name:"Ishita Patel",   roll:"7A-06", status:"graded",      grade:17, late:false, when:"May 26, 10:30 PM",  file:"ishita-ws4.pdf" },
  { name:"Dev Mehta",      roll:"7A-07", status:"submitted",   grade:null, late:true,  when:"May 28, 9:11 AM",  file:"dev-ws4.pdf" },
  { name:"Anika Banerjee", roll:"7A-08", status:"submitted",   grade:null, late:false, when:"May 27, 6:55 PM",  file:"anika-ws4.docx" },
  { name:"Aryan Kapoor",   roll:"7A-09", status:"in-progress", grade:null, late:false, when:null, file:null },
  { name:"Saanvi Rao",     roll:"7A-10", status:"submitted",   grade:null, late:false, when:"May 26, 8:22 PM",  file:"saanvi-ws4.pdf" },
  { name:"Vihaan Nair",    roll:"7A-11", status:"submitted",   grade:null, late:false, when:"May 27, 11:42 AM", file:"vihaan-ws4.pdf" },
  { name:"Zara Khan",      roll:"7A-12", status:"missing",     grade:null, late:false, when:null, file:null },
];

function SubStatus({ s, late }) {
  if (s === "graded")      return <Badge tone="success">Graded</Badge>;
  if (s === "submitted")   return late ? <Badge tone="warning">Submitted · late</Badge> : <Badge tone="info">Submitted</Badge>;
  if (s === "missing")     return <Badge tone="danger">Missing</Badge>;
  if (s === "in-progress") return <Badge tone="neutral">In progress</Badge>;
  return <Badge tone="neutral">{s}</Badge>;
}
function AsnStateBadge({ s }) {
  if (s === "Open")   return <Badge tone="info">Open</Badge>;
  if (s === "Closed") return <Badge tone="neutral">Closed</Badge>;
  if (s === "Draft")  return <Badge tone="warning">Draft</Badge>;
  return <Badge tone="neutral">{s}</Badge>;
}

function fileIcon(f) {
  if (!f) return "file";
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(f)) return "image";
  if (/\.(docx?|odt)$/i.test(f)) return "file-text";
  return "file-text";
}

/* ---------- LIST VIEW ---------- */
function AsnList({ onOpen, onCreate }) {
  const [filter, setFilter] = React.useState("all");
  const rows = ASSIGNMENTS.filter(a => filter === "all" ? true : a.state.toLowerCase() === filter);
  const stats = ASSIGNMENTS.reduce((a, x) => {
    if (x.state === "Open")  { a.open++; a.toGrade += (x.submitted - x.graded); }
    if (x.state === "Draft") a.draft++;
    return a;
  }, { open: 0, draft: 0, toGrade: 0 });

  return (
    <>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="clipboard-list" label="Open assignments" value={String(stats.open)} footer="across 4 classes" />
        <KPI icon="inbox"          label="To grade"         value={String(stats.toGrade)} delta="awaiting review" deltaTone="up" />
        <KPI icon="file-edit"      label="Drafts"           value={String(stats.draft)} footer="not yet published" />
        <KPI icon="check-circle"   label="On-time rate"     value="92%" delta="last 30 days" deltaTone="up" />
      </div>

      <div className="toolbar">
        <Segmented value={filter} onChange={setFilter} options={[
          { label: "All",    value: "all" },
          { label: "Open",   value: "open" },
          { label: "Closed", value: "closed" },
          { label: "Drafts", value: "draft" },
        ]} />
        <div className="search">
          <Icon name="search" size={14} color="#6B7280" />
          <input placeholder="Search assignments" />
        </div>
        <span style={{ marginLeft: "auto", color: "var(--fg-3)", fontSize: 13 }}>{rows.length} assignments</span>
        <Button variant="primary" size="sm" icon="plus" onClick={onCreate}>New assignment</Button>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Class</th>
              <th>Due</th>
              <th>Submissions</th>
              <th>To grade</th>
              <th className="num">Points</th>
              <th>Status</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(a => {
              const toGrade = a.submitted - a.graded;
              const pct = a.total ? Math.round((a.submitted / a.total) * 100) : 0;
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 36, height: 36, borderRadius: 8, background: "var(--eduos-primary-tint)", color: "var(--eduos-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="file-text" size={16} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div className="secondary">{a.subject} · #{a.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{a.cls}</td>
                  <td>{a.due}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--bg-hover)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "var(--eduos-success)" : "var(--eduos-primary)" }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--fg-2)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{a.submitted}/{a.total}</span>
                    </div>
                  </td>
                  <td>{toGrade > 0 ? <span style={{ fontWeight: 600, color: "var(--eduos-warning)" }}>{toGrade}</span> : <span className="secondary">—</span>}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{a.points}</td>
                  <td><AsnStateBadge s={a.state} /></td>
                  <td>
                    {a.state === "Draft"
                      ? <Button variant="ghost" size="sm" icon="send">Publish</Button>
                      : <Button variant="ghost" size="sm" icon="arrow-right" onClick={() => onOpen(a.id)}>Open</Button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- DETAIL VIEW ---------- */
function AsnDetail({ id, onBack }) {
  const a = ASSIGNMENTS.find(x => x.id === id) || ASSIGNMENTS[0];
  const [filter, setFilter] = React.useState("all");
  const [selected, setSelected] = React.useState("7A-01");

  const counts = ASN_ROSTER.reduce((acc, s) => (acc[s.status]++, acc), { graded:0, submitted:0, missing:0, "in-progress":0 });
  const filtered = ASN_ROSTER.filter(s => filter === "all" || s.status === filter);
  const active = ASN_ROSTER.find(s => s.roll === selected) || ASN_ROSTER[0];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-3)", marginBottom: 14 }}>
        <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={onBack}><Icon name="arrow-left" size={16} /></button>
        <span style={{ cursor: "pointer" }} onClick={onBack}>Assignments</span>
        <Icon name="chevron-right" size={14} />
        <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>{a.title}</span>
      </div>

      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1>{a.title}</h1>
            <AsnStateBadge s={a.state} />
          </div>
          <div className="sub">{a.subject} · Class {a.cls} · Due {a.due} · {a.points} points</div>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="bell">Remind missing</Button>
          <Button variant="secondary" icon="download">Download all</Button>
          <Button variant="primary" icon="pencil">Edit</Button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="check-circle"  label="Graded"      value={String(counts.graded)}        footer={`of ${a.total}`} />
        <KPI icon="inbox"         label="To grade"    value={String(counts.submitted)}     delta="ready to review" deltaTone="up" />
        <KPI icon="hourglass"     label="In progress" value={String(counts["in-progress"])} footer="not submitted yet" />
        <KPI icon="circle-alert"  label="Missing"     value={String(counts.missing)}        delta="past due soon" deltaTone="down" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card title="Submissions" sub="Click a student to view their work."
          actions={<Segmented value={filter} onChange={setFilter} options={[
            { label: "All",      value: "all" },
            { label: "To grade", value: "submitted" },
            { label: "Graded",   value: "graded" },
            { label: "Missing",  value: "missing" },
          ]} />}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((s, i) => {
              const isActive = s.roll === selected;
              return (
                <div key={s.roll} onClick={() => setSelected(s.roll)} style={{
                  display: "grid", gridTemplateColumns: "1fr 160px 130px 80px 20px",
                  alignItems: "center", gap: 12, padding: "12px 10px",
                  borderTop: i === 0 ? "none" : "1px solid var(--divider-row)",
                  background: isActive ? "var(--bg-selected)" : "transparent",
                  borderRadius: 6, cursor: "pointer",
                }}>
                  <div className="av-row">
                    <Avatar name={s.name} />
                    <div><div style={{ fontWeight: 600 }}>{s.name}</div><div className="secondary">{s.roll}</div></div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{s.when || <span>—</span>}</div>
                  <SubStatus s={s.status} late={s.late} />
                  <div className="num" style={{ fontWeight: 600, fontSize: 14 }}>
                    {s.grade != null ? `${s.grade}/${a.points}` : <span className="secondary">—</span>}
                  </div>
                  <Icon name="chevron-right" size={16} color="#9CA3AF" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar name={active.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{active.name}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{active.roll} · {active.status === "missing" ? "no submission yet" : active.when}</div>
            </div>
            <SubStatus s={active.status} late={active.late} />
          </div>

          {active.file ? (
            <>
              <div style={{ border: "1px solid var(--divider-row)", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ width: 40, height: 40, borderRadius: 8, background: "var(--eduos-primary-tint)", color: "var(--eduos-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={fileIcon(active.file)} size={18} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.file}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Uploaded {active.when}</div>
                </div>
                <Button variant="secondary" size="sm" icon="external-link">Open</Button>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>Grade</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input className="input" type="number" defaultValue={active.grade ?? ""} placeholder="0" style={{ width: 90 }} />
                  <span style={{ color: "var(--fg-3)", fontSize: 13 }}>/ {a.points}</span>
                </div>
              </div>

              <div className="field">
                <label>Private feedback</label>
                <textarea className="textarea" placeholder="Notes only the student will see…" rows={3} defaultValue={active.grade != null ? "Good work — neat presentation. Watch the sign in Q5." : ""} />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Button variant="secondary" icon="arrow-left">Previous</Button>
                <Button variant="primary" icon="check" style={{ marginLeft: "auto" }}>Save grade</Button>
                <Button variant="ghost" icon="arrow-right">Next</Button>
              </div>
            </>
          ) : (
            <Empty icon="inbox" title="No submission yet"
              sub={`${active.name} hasn't uploaded anything for this assignment.`}
              action={<Button variant="secondary" icon="bell">Send reminder</Button>} />
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------- CREATE MODAL ---------- */
function NewAssignmentModal({ open, onClose }) {
  const [files, setFiles] = React.useState([]);
  const ref = React.useRef(null);
  function onPick(e) {
    const list = Array.from(e.target.files || []).map(f => ({ name: f.name, size: Math.round(f.size / 1024) + " KB" }));
    setFiles(prev => [...prev, ...list]);
  }
  return (
    <Modal open={open} onClose={onClose} title="New assignment" sub="Publish to send to all students in the class."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Save draft</Button>
        <Button variant="primary" icon="send" onClick={onClose}>Publish</Button>
      </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Title</label>
          <input className="input" placeholder="e.g. Algebra · Worksheet 5" />
        </div>
        <div className="field"><label>Subject</label>
          <select className="select"><option>Mathematics</option><option>Science</option><option>English</option><option>History</option></select>
        </div>
        <div className="field"><label>Class</label>
          <select className="select"><option>7-A</option><option>7-B</option><option>8-A</option></select>
        </div>
        <div className="field"><label>Due date</label><input className="input" type="datetime-local" /></div>
        <div className="field"><label>Points</label><input className="input" type="number" defaultValue="20" /></div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Instructions</label>
          <textarea className="textarea" rows={3} placeholder="What students need to do, format, etc." />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Attachments</label>
          <div onClick={() => ref.current && ref.current.click()}
            style={{ border: "1px dashed var(--border-strong)", borderRadius: 10, padding: 16, textAlign: "center", cursor: "pointer", color: "var(--fg-3)" }}>
            <Icon name="upload-cloud" size={20} color="#6B7280" />
            <div style={{ fontSize: 13, marginTop: 6 }}><b style={{ color: "var(--fg-1)" }}>Click to upload</b> or drag files here</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>PDF, DOCX, images — up to 25 MB each</div>
          </div>
          <input ref={ref} type="file" multiple style={{ display: "none" }} onChange={onPick} />
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", border: "1px solid var(--divider-row)", borderRadius: 8, fontSize: 13 }}>
                  <Icon name={fileIcon(f.name)} size={14} color="#6B7280" />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <span style={{ color: "var(--fg-3)", fontSize: 11 }}>{f.size}</span>
                  <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setFiles(files.filter((_, k) => k !== i))}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: "var(--bg-app)", borderRadius: 10, gap: 12 }}>
            <Icon name="bell" size={16} color="#6B7280" />
            <div style={{ flex: 1, fontSize: 13 }}>Notify parents when published</div>
            <Toggle on={true} onChange={() => {}} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- PAGE ---------- */
function PageAssignments() {
  const [openId, setOpenId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  return (
    <div>
      {openId == null ? (
        <>
          <div className="page-head">
            <div><h1>Assignments</h1><div className="sub">Create work, publish to your class, and track submissions.</div></div>
            <div className="actions">
              <Button variant="secondary" icon="download">Export</Button>
              <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New assignment</Button>
            </div>
          </div>
          <AsnList onOpen={setOpenId} onCreate={() => setCreating(true)} />
        </>
      ) : (
        <AsnDetail id={openId} onBack={() => setOpenId(null)} />
      )}
      <NewAssignmentModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
window.PageAssignments = PageAssignments;
