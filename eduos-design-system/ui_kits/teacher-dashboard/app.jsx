/* EduOS — App shell */

const { useState: useStateApp, useRef: useRefApp, useEffect: useEffectApp } = React;

const NAV = [
  { section: "Teach", items: [
    { id: "dashboard",   label: "Dashboard",   icon: "layout-dashboard" },
    { id: "students",    label: "Students",    icon: "users",          count: 142 },
    { id: "attendance",  label: "Attendance",  icon: "calendar-check" },
    { id: "timetable",   label: "Timetable",   icon: "calendar-days" },
    { id: "assignments", label: "Assignments", icon: "file-text",     count: 3 },
    { id: "exams",       label: "Exams",       icon: "clipboard-list" },
    { id: "results",     label: "Results",     icon: "award" },
  ]},
  { section: "Operate", items: [
    { id: "fees",     label: "Fees",            icon: "indian-rupee",   count: 12 },
    { id: "calendar", label: "Calendar",        icon: "calendar" },
    { id: "parent",   label: "Parent messages", icon: "messages-square" },
    { id: "settings", label: "Settings",        icon: "settings" },
  ]},
];

const PAGES = {
  dashboard:  { crumb: "Dashboard",       Comp: () => window.PageDashboard()      },
  students:   { crumb: "Students",        Comp: () => window.PageStudents()       },
  attendance: { crumb: "Attendance",      Comp: () => window.PageAttendance()     },
  timetable:  { crumb: "Timetable",       Comp: () => window.PageTimetable()      },
  assignments:{ crumb: "Assignments",     Comp: () => window.PageAssignments()    },
  exams:      { crumb: "Exams",           Comp: () => window.PageExams()          },
  results:    { crumb: "Results",         Comp: () => window.PageResults()        },
  fees:       { crumb: "Fees",            Comp: () => window.PageFees()           },
  calendar:   { crumb: "Calendar",        Comp: () => window.PageCalendar()       },
  parent:     { crumb: "Parent messages", Comp: () => window.PageParentMessages() },
  settings:   { crumb: "Settings",        Comp: () => window.PageSettings()       },
};

function Sidebar({ active, onNavigate, collapsed, onToggle }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="../../assets/logo-mark.svg" alt="EduOS" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="wordmark">EduOS</div>
          <div className="school">Riverside Public School</div>
        </div>
      </div>
      {NAV.map(group => (
        <div key={group.section} className="nav-section">
          <div className="label">{group.section}</div>
          {group.items.map(it => (
            <div key={it.id} className={`nav-item ${active === it.id ? "active" : ""}`} onClick={() => onNavigate(it.id)}>
              <Icon name={it.icon} size={18} />
              <span className="label" style={{ flex: 1, fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "inherit", padding: 0 }}>{it.label}</span>
              {it.count != null && <span className="count">{it.count}</span>}
            </div>
          ))}
        </div>
      ))}
      <div style={{ marginTop: "auto", padding: "12px 8px 4px", borderTop: "1px solid var(--border-default)" }}>
        <div className="nav-item" onClick={onToggle} style={{ color: "var(--fg-3)" }}>
          <Icon name={collapsed ? "chevrons-right" : "chevrons-left"} size={18} />
          <span className="label" style={{ fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "inherit", padding: 0 }}>Collapse</span>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Notifications dropdown ---------- */
const NOTIFICATIONS = [
  { id:"n1", icon:"file-check-2",  tone:"success", who:"Aarav Sharma",       what:"submitted Algebra · Worksheet 4.", when:"2m",  unread:true },
  { id:"n2", icon:"indian-rupee",  tone:"success", who:"Priya Verma's parent", what:"paid the term-2 tuition fee (₹4,500).", when:"18m", unread:true },
  { id:"n3", icon:"user-x",        tone:"danger",  who:"Rohan Iyer",         what:"was marked absent today.",         when:"3h",  unread:true },
  { id:"n4", icon:"message-square",tone:"info",    who:"Vikram Iyer (parent)",what:"replied: \"Rohan was unwell, sorry for the absence.\"", when:"3h", unread:false },
  { id:"n5", icon:"clipboard-list",tone:"warning", who:"EduOS",              what:"reminder — Mid-term Mathematics on Mon, May 27.", when:"yesterday", unread:false },
  { id:"n6", icon:"sparkles",      tone:"info",    who:"AI exam builder",    what:"draft for Mid-term Mathematics is ready.", when:"yesterday", unread:false },
];

function Notifications({ onClose }) {
  const [tab, setTab] = useStateApp("all");
  const items = NOTIFICATIONS.filter(n => tab === "all" || (tab === "unread" && n.unread));
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", right: 0, top: 44, width: 380,
        background: "#FFF", border: "1px solid var(--border-default)",
        borderRadius: 12, boxShadow: "var(--shadow-md)", zIndex: 50,
        overflow: "hidden",
      }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Notifications</div>
        <button className="icon-btn" title="Settings" style={{ width: 28, height: 28 }}><Icon name="settings" size={14} /></button>
      </div>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--divider-row)", display: "flex", alignItems: "center", gap: 8 }}>
        <Segmented value={tab} onChange={setTab} options={[
          { label: "All",    value: "all" },
          { label: "Unread", value: "unread" },
        ]} />
        <Button variant="ghost" size="sm" icon="check" style={{ marginLeft: "auto" }}>Mark all read</Button>
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>No notifications.</div>
        ) : items.map((n, i) => {
          const color = n.tone === "success" ? "var(--eduos-success)" : n.tone === "danger" ? "var(--eduos-danger)" : n.tone === "warning" ? "var(--eduos-warning)" : "var(--eduos-primary)";
          const tint  = n.tone === "success" ? "var(--eduos-success-tint)" : n.tone === "danger" ? "var(--eduos-danger-tint)" : n.tone === "warning" ? "var(--eduos-warning-tint)" : "var(--eduos-primary-tint)";
          return (
            <div key={n.id} style={{
              display: "flex", gap: 12, padding: "12px 16px",
              borderTop: i === 0 ? "none" : "1px solid var(--divider-row)",
              background: n.unread ? "rgba(234,241,254,0.4)" : "transparent",
              cursor: "pointer",
            }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: tint, color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={n.icon} size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600 }}>{n.who}</span> <span style={{ color: "var(--fg-2)" }}>{n.what}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>{n.when}</div>
              </div>
              {n.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--eduos-primary)", flexShrink: 0, marginTop: 6 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--border-default)", background: "#FAFBFC" }}>
        <button onClick={onClose} style={{ width: "100%", height: 34, border: "none", background: "transparent", color: "var(--eduos-primary)", fontWeight: 600, fontSize: 13, cursor: "pointer", borderRadius: 6 }}>
          View all notifications
        </button>
      </div>
    </div>
  );
}

function Topbar({ crumb, onMenu }) {
  const [notifOpen, setNotifOpen] = useStateApp(false);
  const wrapRef = useRefApp(null);
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  useEffectApp(() => {
    if (!notifOpen) return;
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setNotifOpen(false);
    }
    function onEsc(e) { if (e.key === "Escape") setNotifOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [notifOpen]);

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenu} title="Menu"><Icon name="menu" size={20} /></button>
      <div className="crumbs">
        <span>Class 7-A</span>
        <Icon name="chevron-right" size={14} />
        <span className="current">{crumb}</span>
      </div>
      <div className="search">
        <Icon name="search" size={16} color="#6B7280" />
        <input placeholder="Search students, fees, exams…" />
        <kbd>⌘K</kbd>
      </div>
      <div className="actions">
        <button className="icon-btn" title="Help"><Icon name="circle-help" size={18} /></button>
        <div ref={wrapRef} style={{ position: "relative" }}>
          <button className="icon-btn" title="Notifications" onClick={() => setNotifOpen(v => !v)}>
            <Icon name="bell" size={18} />
            {unreadCount > 0 && <span className="dot" />}
          </button>
          {notifOpen && <Notifications onClose={() => setNotifOpen(false)} />}
        </div>
        <span className="avatar">PR</span>
      </div>
    </header>
  );
}

function App() {
  const initial = (location.hash || "#dashboard").slice(1);
  const [active, setActive] = useStateApp(PAGES[initial] ? initial : "dashboard");
  const [collapsed, setCollapsed] = useStateApp(false);
  const [menuOpen, setMenuOpen] = useStateApp(false);
  function go(id) {
    setActive(id);
    history.replaceState(null, "", "#" + id);
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }
  const Page = PAGES[active].Comp;
  return (
    <div className={`app ${collapsed ? "collapsed" : ""} ${menuOpen ? "menu-open" : ""}`}>
      <Sidebar active={active} onNavigate={go} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="scrim" onClick={() => setMenuOpen(false)} />
      <main>
        <Topbar crumb={PAGES[active].crumb} onMenu={() => setMenuOpen(true)} />
        <div className="page" data-screen-label={active}><Page /></div>
      </main>
    </div>
  );
}

try { window.lucide && window.lucide.createIcons(); } catch {}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
