/* EduOS — Calendar: month grid + upcoming events */

const EVENTS = [
  { id:"e1", title:"PTM · Class 7-A",          date:"2026-05-29", time:"4:00 PM", type:"PTM",      desc:"Parent-teacher meeting in classroom 7-A.",            location:"Room 7-A" },
  { id:"e2", title:"Mid-term · Mathematics",   date:"2026-05-27", time:"9:00 AM", type:"Exam",     desc:"Class 7-A · 2 hours · all topics covered so far.",     location:"Exam hall" },
  { id:"e3", title:"Algebra · Worksheet 4 due",date:"2026-05-27", time:"11:59 PM",type:"Assignment", desc:"All 12 students must submit via the portal.",         location:null },
  { id:"e4", title:"Surprise quiz · Science",  date:"2026-05-29", time:"10:30 AM",type:"Exam",     desc:"Class 7-A · 30 minutes · unannounced to students.",    location:"Room 7-A" },
  { id:"e5", title:"Science fair preparation", date:"2026-05-30", time:"2:00 PM", type:"Event",    desc:"Help students set up their stalls.",                   location:"Atrium" },
  { id:"e6", title:"School holiday · Buddha Purnima", date:"2026-05-31", time:"All day", type:"Holiday", desc:"School closed.",                                  location:null },
  { id:"e7", title:"Staff meeting",            date:"2026-05-25", time:"3:30 PM", type:"Meeting",  desc:"Term 2 planning · staffroom.",                         location:"Staffroom" },
  { id:"e8", title:"Lab session · Class 7-A",  date:"2026-05-26", time:"1:30 PM", type:"Class",    desc:"Acids & bases — practical demonstration.",             location:"Science lab" },
  { id:"e9", title:"Mid-term · Science",       date:"2026-06-04", time:"9:00 AM", type:"Exam",     desc:"Class 7-A · 2 hours.",                                 location:"Exam hall" },
  { id:"e10",title:"PTM · Class 8-A",          date:"2026-06-05", time:"4:00 PM", type:"PTM",      desc:"Parent-teacher meeting in classroom 8-A.",            location:"Room 8-A" },
];

const TYPE_META = {
  Exam:       { color:"#2F6FED", tint:"#EAF1FE", icon:"clipboard-list" },
  PTM:        { color:"#7C3AED", tint:"#EDE9FE", icon:"users" },
  Assignment: { color:"#D97706", tint:"#FEF3C7", icon:"file-text" },
  Event:      { color:"#16A34A", tint:"#DCFCE7", icon:"sparkles" },
  Holiday:    { color:"#DC2626", tint:"#FEE2E2", icon:"calendar-x" },
  Meeting:    { color:"#475569", tint:"#E5E7EB", icon:"briefcase" },
  Class:      { color:"#0891B2", tint:"#CFFAFE", icon:"book-open" },
};

function startOfMonth(y, m) { return new Date(y, m, 1); }
function daysInMonth(y, m)  { return new Date(y, m + 1, 0).getDate(); }
function toISO(d)           { return d.toISOString().slice(0, 10); }

function PageCalendar() {
  // May 2026
  const [year, setYear] = React.useState(2026);
  const [month, setMonth] = React.useState(4); // 0-indexed → May
  const [selected, setSelected] = React.useState("2026-05-27");
  const [filter, setFilter] = React.useState(new Set(Object.keys(TYPE_META)));

  const monthName = new Date(year, month, 1).toLocaleString("en-US", { month: "long" });
  const todayISO = "2026-05-25";

  // Calendar grid: pad start to Mon
  const first = startOfMonth(year, month);
  let startWeekday = first.getDay(); // 0=Sun
  startWeekday = (startWeekday + 6) % 7; // shift so Mon=0
  const numDays = daysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate = EVENTS.reduce((m, e) => { (m[e.date] ||= []).push(e); return m; }, {});
  const visible = EVENTS.filter(e => filter.has(e.type));
  const selectedEvents = visible.filter(e => e.date === selected).sort((a,b) => a.time.localeCompare(b.time));
  const upcoming = visible
    .filter(e => e.date >= todayISO)
    .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 6);

  function toggleFilter(t) {
    const next = new Set(filter);
    next.has(t) ? next.delete(t) : next.add(t);
    setFilter(next);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Calendar</h1>
          <div className="sub">Exams, PTMs, holidays, and school events — all in one view.</div>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="external-link">Sync to Google</Button>
          <Button variant="primary" icon="plus">New event</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Month grid */}
        <Card pad={false}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border-default)", gap: 12 }}>
            <button className="icon-btn" onClick={() => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); }}>
              <Icon name="chevron-left" size={16} />
            </button>
            <div style={{ fontWeight: 700, fontSize: 16, minWidth: 160 }}>{monthName} {year}</div>
            <button className="icon-btn" onClick={() => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); }}>
              <Icon name="chevron-right" size={16} />
            </button>
            <Button variant="secondary" size="sm" onClick={() => { setMonth(4); setYear(2026); setSelected(todayISO); }}>Today</Button>
            <div style={{ marginLeft: "auto" }}>
              <Segmented value="month" onChange={()=>{}} options={[
                { label: "Month", value: "month" },
                { label: "Week",  value: "week" },
              ]} />
            </div>
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, letterSpacing: 0.04, textTransform: "uppercase", color: "var(--fg-3)", borderBottom: "1px solid var(--divider-row)", textAlign: "left" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} style={{ minHeight: 96, borderRight: "1px solid var(--divider-row)", borderBottom: "1px solid var(--divider-row)", background: "#FAFBFC" }} />;
              const iso = toISO(d);
              const es = (byDate[iso] || []).filter(e => filter.has(e.type));
              const isToday = iso === todayISO;
              const isSel = iso === selected;
              return (
                <div key={i} onClick={() => setSelected(iso)} style={{
                  minHeight: 96, padding: 6, cursor: "pointer",
                  borderRight: (i % 7 === 6) ? "none" : "1px solid var(--divider-row)",
                  borderBottom: "1px solid var(--divider-row)",
                  background: isSel ? "var(--bg-selected)" : "#FFF",
                  position: "relative",
                }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: isToday ? "var(--eduos-primary)" : "transparent",
                      color: isToday ? "#FFF" : "var(--fg-1)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600,
                    }}>{d.getDate()}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {es.slice(0, 3).map(e => {
                      const m = TYPE_META[e.type];
                      return (
                        <div key={e.id} style={{ background: m.tint, color: m.color, fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: `2px solid ${m.color}` }}>
                          {e.title}
                        </div>
                      );
                    })}
                    {es.length > 3 && <div style={{ fontSize: 11, color: "var(--fg-3)", padding: "0 6px" }}>+{es.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sidebar: filters + selected day + upcoming */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Filter by type">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(TYPE_META).map(([t, m]) => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px", cursor: "pointer" }}>
                  <input type="checkbox" checked={filter.has(t)} onChange={() => toggleFilter(t)} />
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
                  <span style={{ fontSize: 13, color: "var(--fg-1)", fontWeight: 500 }}>{t}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--fg-3)" }}>
                    {EVENTS.filter(e => e.type === t).length}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card title={new Date(selected).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            sub={`${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}`}>
            {selectedEvents.length === 0 ? (
              <div style={{ color: "var(--fg-3)", fontSize: 13 }}>Nothing scheduled.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedEvents.map(e => {
                  const m = TYPE_META[e.type];
                  return (
                    <div key={e.id} style={{ display: "flex", gap: 12, padding: 12, border: "1px solid var(--divider-row)", borderRadius: 10 }}>
                      <span style={{ width: 36, height: 36, borderRadius: 8, background: m.tint, color: m.color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name={m.icon} size={16} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2, display: "flex", gap: 8 }}>
                          <span>{e.time}</span>
                          {e.location && <><span>·</span><span>{e.location}</span></>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Up next" actions={<Button variant="ghost" size="sm">View all</Button>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {upcoming.map((e, i) => {
                const m = TYPE_META[e.type];
                const d = new Date(e.date);
                return (
                  <div key={e.id} onClick={() => setSelected(e.date)} style={{
                    display: "flex", gap: 12, padding: "10px 4px", cursor: "pointer",
                    borderTop: i === 0 ? "none" : "1px solid var(--divider-row)",
                  }}>
                    <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{d.toLocaleString("en-US", { month: "short" })}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{d.getDate()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{e.time}</div>
                    </div>
                    <Badge tone={e.type === "Exam" ? "info" : e.type === "Holiday" ? "danger" : e.type === "PTM" ? "info" : "neutral"}>{e.type}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.PageCalendar = PageCalendar;
