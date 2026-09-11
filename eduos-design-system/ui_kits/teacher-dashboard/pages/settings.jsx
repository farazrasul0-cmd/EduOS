
function PageSettings() {
  const [tab, setTab] = React.useState("profile");
  const [sms, setSms] = React.useState(true);
  const [email, setEmail] = React.useState(true);
  const [whatsapp, setWhatsapp] = React.useState(false);
  return (
    <div>
      <div className="page-head">
        <div><h1>Settings</h1><div className="sub">Manage your school, classes, billing, and integrations.</div></div>
        <div className="actions"><Button variant="primary" icon="save">Save changes</Button></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[["profile","User profile","user"],["school","School","school"],["classes","Classes","book-open"],["notifications","Notifications","bell"],["billing","Billing & plan","credit-card"],["integrations","Integrations","plug"],["security","Security","shield"]].map(([id, label, icon]) => (
            <div key={id} className={`nav-item ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <Icon name={icon} size={16} /><span style={{ fontWeight: 500, fontSize: 14 }}>{label}</span>
            </div>
          ))}
        </nav>
        <div>
          {tab === "profile" && (
            <Card title="User profile" sub="This information is shown across EduOS.">
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                <span style={{ width: 64, height: 64, borderRadius: "50%", background: "#2F6FED", color: "#FFF", fontWeight: 700, fontSize: 22, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>PR</span>
                <div><div style={{ fontWeight: 600 }}>Priya Ramaswamy</div><div style={{ fontSize: 13, color: "var(--fg-3)" }}>Class teacher · 7-A · Mathematics</div></div>
                <Button variant="secondary" size="sm" icon="upload" style={{ marginLeft: "auto" }}>Upload photo</Button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field"><label>Full name</label><input className="input" defaultValue="Priya Ramaswamy" /></div>
                <div className="field"><label>Email</label><input className="input" defaultValue="priya.r@riverside.edu" /></div>
                <div className="field"><label>Mobile</label><input className="input" defaultValue="+91 98765 43210" /></div>
                <div className="field"><label>Subject</label><input className="input" defaultValue="Mathematics" /></div>
              </div>
            </Card>
          )}
          {tab === "school" && (
            <Card title="School details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field"><label>School name</label><input className="input" defaultValue="Riverside Public School" /></div>
                <div className="field"><label>Affiliation</label><input className="input" defaultValue="CBSE · New Delhi" /></div>
                <div className="field" style={{ gridColumn: "1 / -1" }}><label>Address</label><textarea className="textarea">12, Park Road, Civil Lines, Pune – 411001</textarea></div>
                <div className="field"><label>Academic year</label><select className="select"><option>2025 – 26</option></select></div>
                <div className="field"><label>Currency</label><select className="select"><option>₹ Indian Rupee</option></select></div>
              </div>
            </Card>
          )}
          {tab === "classes" && (
            <Card title="Classes" actions={<Button variant="primary" size="sm" icon="plus">Add class</Button>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["7-A","Mathematics","Mon · Wed · Fri · 9:00 AM",12],["7-B","Mathematics","Tue · Thu · 9:00 AM",14],["8-A","Mathematics","Mon · Wed · 10:30 AM",16],["8-B","Mathematics","Tue · Thu · 10:30 AM",15]].map(([c, sub, sched, n]) => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1px solid var(--divider-row)", borderRadius: 10 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 8, background: "var(--eduos-primary-tint)", color: "var(--eduos-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{c}</span>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Class {c} · {sub}</div><div style={{ fontSize: 12, color: "var(--fg-3)" }}>{sched} · {n} students</div></div>
                    <Button variant="ghost" size="sm" icon="pencil">Edit</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {tab === "notifications" && (
            <Card title="Notifications" sub="When EduOS should notify you, and how.">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[["Absent student","When a student is marked absent.",sms,setSms],["Pending fees","When a fee crosses its due date.",email,setEmail],["Parent reply","When a parent replies in the portal.",true,()=>{}],["AI exam ready","When an AI-drafted exam finishes generating.",false,()=>{}]].map(([title, sub, v, s], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 4px", borderTop: i === 0 ? "none" : "1px solid var(--divider-row)" }}>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>{title}</div><div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{sub}</div></div>
                    <Toggle on={v} onChange={s} />
                  </div>
                ))}
              </div>
              <hr className="hr" />
              <div className="t-micro" style={{ marginBottom: 10 }}>Channels</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[["SMS","To registered mobile",sms,setSms],["Email","Daily 7 PM digest",email,setEmail],["WhatsApp","Beta · India only",whatsapp,setWhatsapp]].map(([t,p,v,s]) => (
                  <div key={t} className={`radio-card ${v ? "active" : ""}`} onClick={() => s(!v)}>
                    <div className="r" /><div><h4>{t}</h4><p>{p}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {tab === "billing" && (
            <Card title="Billing & plan">
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "var(--eduos-primary-tint)", border: "1px solid #D6E4FC", borderRadius: 12, marginBottom: 16 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--eduos-primary)", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="rocket" size={20} /></span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>EduOS · Schools</div><div style={{ fontSize: 13, color: "var(--fg-2)" }}>₹49 / student / month · 142 active students</div></div>
                <Button variant="secondary" size="sm" icon="external-link">Manage</Button>
              </div>
            </Card>
          )}
          {tab === "integrations" && (
            <Card title="Integrations">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Google Classroom","Sync rosters and assignments","graduation-cap",true],["Razorpay","Collect fees online","credit-card",true],["WhatsApp Business","Parent messaging","message-circle",false],["Zoom","Schedule online classes","video",false]].map(([name, sub, icon, on]) => (
                  <div key={name} style={{ display: "flex", gap: 12, padding: 14, border: "1px solid var(--divider-row)", borderRadius: 10, alignItems: "center" }}>
                    <span style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-app)", color: "var(--eduos-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={20} /></span>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{name}</div><div style={{ fontSize: 12, color: "var(--fg-3)" }}>{sub}</div></div>
                    {on ? <Badge tone="success">Connected</Badge> : <Button variant="secondary" size="sm">Connect</Button>}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {tab === "security" && (
            <Card title="Security">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[["Two-factor authentication","Use an authenticator app on sign-in.",true],["Sign-in alerts","Email me on new device sign-ins.",true],["Session timeout","Sign me out after 30 min inactive.",false]].map(([t, s, v], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 4px", borderTop: i === 0 ? "none" : "1px solid var(--divider-row)" }}>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>{t}</div><div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{s}</div></div>
                    <Toggle on={v} onChange={() => {}} />
                  </div>
                ))}
              </div>
              <hr className="hr" />
              <Button variant="danger" icon="log-out">Sign out everywhere</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
window.PageSettings = PageSettings;
