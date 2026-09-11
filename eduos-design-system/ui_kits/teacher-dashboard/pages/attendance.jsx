
const ATT_STUDENTS = [
  { name: "Aarav Sharma",   roll: "7A-01" }, { name: "Priya Verma",    roll: "7A-02" },
  { name: "Rohan Iyer",     roll: "7A-03" }, { name: "Maya Krishnan",  roll: "7A-04" },
  { name: "Kabir Singh",    roll: "7A-05" }, { name: "Ishita Patel",   roll: "7A-06" },
  { name: "Dev Mehta",      roll: "7A-07" }, { name: "Anika Banerjee", roll: "7A-08" },
  { name: "Aryan Kapoor",   roll: "7A-09" }, { name: "Saanvi Rao",     roll: "7A-10" },
  { name: "Vihaan Nair",    roll: "7A-11" }, { name: "Zara Khan",      roll: "7A-12" },
];
const DEFAULT_STATE = { "7A-01":"present","7A-02":"present","7A-03":"absent","7A-04":"present","7A-05":"present","7A-06":"present","7A-07":"late","7A-08":"present","7A-09":"absent","7A-10":"present","7A-11":"present","7A-12":"present" };
const STATUS = { present: { label:"Present", icon:"check" }, absent: { label:"Absent", icon:"x" }, late: { label:"Late", icon:"clock" } };

function PageAttendance() {
  const [state, setState] = React.useState(DEFAULT_STATE);
  const set = (roll, val) => setState(s => ({ ...s, [roll]: val }));
  const counts = Object.values(state).reduce((a,v)=>(a[v]++,a),{present:0,absent:0,late:0});
  const total = ATT_STUDENTS.length;
  const pct = Math.round((counts.present / total) * 100);
  return (
    <div>
      <div className="page-head">
        <div><h1>Attendance</h1><div className="sub">Class 7-A · Mon, May 25, 2026</div></div>
        <div className="actions">
          <Button variant="secondary" icon="calendar">May 25</Button>
          <Button variant="secondary" icon="users">Mark all present</Button>
          <Button variant="primary" icon="save">Save attendance</Button>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="users"      label="Total students" value={String(total)} />
        <KPI icon="user-check" label="Present"        value={String(counts.present)} delta={`${pct}%`} deltaTone="up" />
        <KPI icon="user-x"     label="Absent"         value={String(counts.absent)}  delta="needs attention" deltaTone="down" />
        <KPI icon="clock"      label="Late"           value={String(counts.late)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card title="Mark attendance" sub="Tap a status for each student."
          actions={<Segmented value="day" onChange={()=>{}} options={[{label:"Day",value:"day"},{label:"Period",value:"period"}]} />}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ATT_STUDENTS.map((s, i) => (
              <div key={s.roll} style={{ display: "grid", gridTemplateColumns: "40px 1fr 220px", alignItems: "center", padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--divider-row)" }}>
                <span style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 500 }}>{s.roll}</span>
                <div className="av-row"><Avatar name={s.name} /><div style={{ fontWeight: 600 }}>{s.name}</div></div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {["present","absent","late"].map(k => {
                    const active = state[s.roll] === k;
                    const color = k === "present" ? "#16A34A" : k === "absent" ? "#DC2626" : "#D97706";
                    const tint  = k === "present" ? "#DCFCE7" : k === "absent" ? "#FEE2E2" : "#FEF3C7";
                    return (
                      <button key={k} onClick={() => set(s.roll, k)} style={{
                        height: 30, padding: "0 10px", borderRadius: 8, border: "1px solid " + (active ? color : "var(--border-default)"),
                        background: active ? tint : "#FFF", color: active ? color : "var(--fg-2)",
                        fontWeight: 600, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer"
                      }}><Icon name={STATUS[k].icon} size={14} />{STATUS[k].label}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Today's summary">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Donut size={120} thickness={16} centerValue={`${pct}%`} centerLabel="present"
                segments={[{ value: counts.present, color: "#16A34A" },{ value: counts.late, color: "#D97706" },{ value: counts.absent, color: "#DC2626" }]} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                {[["Present","#16A34A",counts.present],["Late","#D97706",counts.late],["Absent","#DC2626",counts.absent]].map(([l,c,v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><span style={{ width: 8, height: 8, background: c, borderRadius: 2, display: "inline-block", marginRight: 6 }}/>{l}</span><b>{v}</b>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card title="Auto-notify parents">
            <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: "20px", marginBottom: 12 }}>When you save, parents of absent students receive an SMS.</p>
            {[["SMS notifications", true],["Parent portal alert", true],["Email digest", false]].map(([t,v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--divider-row)" }}>
                <span style={{ fontSize: 13 }}>{t}</span><Toggle on={v} onChange={()=>{}} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
window.PageAttendance = PageAttendance;
