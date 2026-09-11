
function PageDashboard() {
  const weekAttendance = [
    { label: "Mon", value: 96 }, { label: "Tue", value: 92 }, { label: "Wed", value: 89 },
    { label: "Thu", value: 94 }, { label: "Fri", value: 97 }, { label: "Sat", value: 84, dim: true },
  ];
  const activity = [
    { who: "Aarav Sharma", what: "submitted Algebra worksheet", when: "2m ago", icon: "file-check-2", tone: "success" },
    { who: "Priya Verma's parent", what: "paid term-2 tuition fee", when: "18m ago", icon: "indian-rupee", tone: "success" },
    { who: "You", what: "published Mid-term results to 7-A", when: "1h ago", icon: "send", tone: "info" },
    { who: "Rohan Iyer", what: "marked absent", when: "today, 9:05 AM", icon: "user-x", tone: "danger" },
    { who: "Maya Krishnan", what: "joined Class 7-A", when: "yesterday", icon: "user-plus", tone: "info" },
  ];
  const upcoming = [
    { name: "Mid-term · Mathematics", date: "Mon, May 27", state: "Scheduled", icon: "clipboard-list" },
    { name: "Algebra · Worksheet 4",  date: "Due Wed, May 27", state: "12 / 12 submitted", icon: "file-text" },
    { name: "Science · Lab report",   date: "Due Fri, May 30", state: "8 / 12 submitted",  icon: "file-text" },
  ];
  return (
    <div>
      <div className="page-head">
        <div><h1>Good morning, Priya</h1><div className="sub">Here's what's happening across your classes today.</div></div>
        <div className="actions">
          <Button variant="secondary" icon="download">Export</Button>
          <Button variant="primary" icon="plus">Quick add</Button>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="calendar-check" label="Attendance today" value="92%"     delta="+3% vs. last week" deltaTone="up" />
        <KPI icon="users"          label="Active students" value="142"     footer="across 4 classes" />
        <KPI icon="indian-rupee"   label="Pending fees"    value="₹84,500" delta="12 students" deltaTone="down" />
        <KPI icon="clipboard-list" label="Upcoming exams"  value="3"       footer="this week" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="Attendance this week" sub="Class 7-A · Mon – Sat"
          actions={<Segmented options={[{label:"7-A",value:"7a"},{label:"All",value:"all"}]} value="7a" onChange={()=>{}} />}>
          <BarChart data={weekAttendance} height={220} />
        </Card>
        <Card title="Fee status" sub="May 2026">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Donut size={140} thickness={18} centerValue="71%" centerLabel="collected"
              segments={[{ value: 71, color: "#16A34A" },{ value: 17, color: "#D97706" },{ value: 12, color: "#DC2626" }]} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              {[["Paid","#16A34A","₹4.2L"],["Due soon","#D97706","₹1.0L"],["Overdue","#DC2626","₹84.5k"]].map(([l,c,v])=>(
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
                  <span style={{ flex: 1, color: "var(--fg-2)" }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <Card title="Recent activity" actions={<Button variant="ghost" size="sm">View all</Button>}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid var(--divider-row)" }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-app)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: a.tone === "danger" ? "var(--eduos-danger)" : a.tone === "success" ? "var(--eduos-success)" : "var(--eduos-primary)" }}>
                  <Icon name={a.icon} size={16} />
                </span>
                <div style={{ flex: 1, fontSize: 14 }}><span style={{ fontWeight: 600 }}>{a.who}</span> <span style={{ color: "var(--fg-2)" }}>{a.what}</span></div>
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{a.when}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="What's next" actions={<Button variant="ghost" size="sm" icon="plus">Add</Button>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid var(--divider-row)", borderRadius: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, background: "var(--eduos-primary-tint)", color: "var(--eduos-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={u.icon} size={16} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{u.date}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>{u.state}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
window.PageDashboard = PageDashboard;
