
const STUDENTS = [
  { name: "Aarav Sharma",   roll: "7A-01", cls: "7-A", parent: "Rahul Sharma",  att: 96, fees: "Paid",    last: "Today" },
  { name: "Priya Verma",    roll: "7A-02", cls: "7-A", parent: "Sunita Verma",  att: 91, fees: "Paid",    last: "Today" },
  { name: "Rohan Iyer",     roll: "7A-03", cls: "7-A", parent: "Vikram Iyer",   att: 78, fees: "Overdue", last: "Yesterday" },
  { name: "Maya Krishnan",  roll: "7A-04", cls: "7-A", parent: "Lakshmi K.",    att: 99, fees: "Paid",    last: "Today" },
  { name: "Kabir Singh",    roll: "7A-05", cls: "7-A", parent: "Manjeet Singh", att: 88, fees: "Due",     last: "Today" },
  { name: "Ishita Patel",   roll: "7A-06", cls: "7-A", parent: "Anjali Patel",  att: 94, fees: "Paid",    last: "Today" },
  { name: "Dev Mehta",      roll: "7A-07", cls: "7-A", parent: "Nilesh Mehta",  att: 82, fees: "Due",     last: "Today" },
  { name: "Anika Banerjee", roll: "7A-08", cls: "7-A", parent: "Rina Banerjee", att: 97, fees: "Paid",    last: "Today" },
  { name: "Aryan Kapoor",   roll: "7A-09", cls: "7-A", parent: "Sanjay Kapoor", att: 71, fees: "Overdue", last: "3 days ago" },
  { name: "Saanvi Rao",     roll: "7A-10", cls: "7-A", parent: "Kiran Rao",     att: 95, fees: "Paid",    last: "Today" },
  { name: "Vihaan Nair",    roll: "7A-11", cls: "7-A", parent: "Anita Nair",    att: 89, fees: "Paid",    last: "Today" },
  { name: "Zara Khan",      roll: "7A-12", cls: "7-A", parent: "Faisal Khan",   att: 93, fees: "Paid",    last: "Today" },
];
function FeeBadge({ value }) {
  if (value === "Paid")    return <Badge tone="success">Paid</Badge>;
  if (value === "Due")     return <Badge tone="warning">Due</Badge>;
  if (value === "Overdue") return <Badge tone="danger">Overdue</Badge>;
  return <Badge tone="neutral">{value}</Badge>;
}
function PageStudents() {
  const [q, setQ] = React.useState("");
  const [cls, setCls] = React.useState("7-A");
  const [open, setOpen] = React.useState(false);
  const [photo, setPhoto] = React.useState(null);
  const [newName, setNewName] = React.useState("");
  const fileRef = React.useRef(null);
  function onPickPhoto(e) {
    const f = e.target.files && e.target.files[0];
    if (!f || !/^image\//.test(f.type)) return;
    setPhoto({ url: URL.createObjectURL(f), name: f.name, size: Math.round(f.size / 1024) + " KB" });
  }
  function resetModal() {
    setPhoto(null); setNewName(""); setOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  const rows = STUDENTS.filter(s => (cls === "all" || s.cls === cls) && (q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.roll.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <div className="page-head">
        <div><h1>Students</h1><div className="sub">142 active students across 4 classes.</div></div>
        <div className="actions">
          <Button variant="secondary" icon="upload">Import CSV</Button>
          <Button variant="primary" icon="user-plus" onClick={() => setOpen(true)}>Add student</Button>
        </div>
      </div>
      <div className="toolbar">
        <div className="search"><Icon name="search" size={14} color="#6B7280" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or roll no." /></div>
        <Segmented value={cls} onChange={setCls} options={[
          { label: "All classes", value: "all" },{ label: "7-A", value: "7-A" }, { label: "7-B", value: "7-B" },
          { label: "8-A", value: "8-A" }, { label: "8-B", value: "8-B" },
        ]} />
        <span style={{ marginLeft: "auto", color: "var(--fg-3)", fontSize: 13 }}>{rows.length} of {STUDENTS.length}</span>
        <Button variant="secondary" size="sm" icon="sliders-horizontal">Filters</Button>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th style={{ width: 32 }}><input type="checkbox" /></th>
            <th>Student</th><th>Roll no.</th><th>Class</th><th>Parent</th>
            <th className="num">Attendance</th><th>Fees</th><th>Last activity</th>
            <th style={{ width: 40 }}></th>
          </tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.roll}>
                <td><input type="checkbox" /></td>
                <td><div className="av-row"><Avatar name={s.name} /><div><div style={{ fontWeight: 600 }}>{s.name}</div><div className="secondary">{s.parent}</div></div></div></td>
                <td className="secondary">{s.roll}</td>
                <td>{s.cls}</td>
                <td>{s.parent}</td>
                <td className="num" style={{ fontWeight: 600, color: s.att < 80 ? "var(--eduos-danger)" : "var(--fg-1)" }}>{s.att}%</td>
                <td><FeeBadge value={s.fees} /></td>
                <td className="secondary">{s.last}</td>
                <td><button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="more-horizontal" size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={resetModal} title="Add student" sub="They'll be invited to join Class 7-A."
        footer={<>
          <Button variant="ghost" onClick={resetModal}>Cancel</Button>
          <Button variant="primary" onClick={resetModal}>Add student</Button>
        </>}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "4px 0 18px", borderBottom: "1px solid var(--divider-row)", marginBottom: 18 }}>
          <div style={{ position: "relative" }}>
            {photo ? (
              <img src={photo.url} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-default)" }} />
            ) : newName.trim() ? (
              <span style={{ width: 72, height: 72, borderRadius: "50%", background: avColor(newName), color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 26 }}>{initials(newName)}</span>
            ) : (
              <span style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--bg-app)", border: "1px dashed var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="user" size={28} color="#9CA3AF" /></span>
            )}
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()} title="Upload photo"
              style={{ position: "absolute", right: -2, bottom: -2, width: 26, height: 26, borderRadius: "50%",
                background: "#2F6FED", color: "#FFF", border: "2px solid #FFF", boxShadow: "var(--shadow-sm)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="camera" size={13} color="#FFF" />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Profile photo</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
              {photo ? <span>{photo.name} · {photo.size}</span> : "PNG or JPG, up to 5 MB. Square images look best."}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Button variant="secondary" size="sm" icon="upload" onClick={() => fileRef.current && fileRef.current.click()}>
                {photo ? "Replace photo" : "Upload photo"}
              </Button>
              {photo && <Button variant="ghost" size="sm" icon="trash-2" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}>Remove</Button>}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={onPickPhoto} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field"><label>Full name</label><input className="input" placeholder="e.g. Aarav Sharma" value={newName} onChange={e => setNewName(e.target.value)} /></div>
          <div className="field"><label>Roll no.</label><input className="input" placeholder="Auto-assigned" /></div>
          <div className="field"><label>Date of birth</label><input className="input" type="date" /></div>
          <div className="field"><label>Class</label><select className="select"><option>7-A</option><option>7-B</option><option>8-A</option></select></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Parent email</label><input className="input" placeholder="parent@email.com" /><span className="hint">Used for SMS receipts and the Parent portal invite.</span></div>
        </div>
      </Modal>
    </div>
  );
}
window.PageStudents = PageStudents;
