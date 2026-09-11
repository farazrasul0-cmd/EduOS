
const THREADS = [
  { parent: "Rahul Sharma",  child: "Aarav Sharma",  unread: 2, last: "Thanks for the update!", when: "10m" },
  { parent: "Sunita Verma",  child: "Priya Verma",   unread: 0, last: "Will join the PTM on Friday.", when: "1h" },
  { parent: "Vikram Iyer",   child: "Rohan Iyer",    unread: 1, last: "Rohan was unwell, sorry for the absence.", when: "2h" },
  { parent: "Lakshmi K.",    child: "Maya Krishnan", unread: 0, last: "Could we discuss her math performance?", when: "Yesterday" },
  { parent: "Manjeet Singh", child: "Kabir Singh",   unread: 0, last: "Received the fee receipt, thank you.", when: "2 days" },
];
const MESSAGES = [
  { from: "parent", text: "Hello, just wanted to confirm — is the PTM happening on Friday at 4 PM?", time: "9:18 AM" },
  { from: "me",     text: "Yes, Friday May 29 at 4:00 PM in classroom 7-A.", time: "9:42 AM" },
  { from: "parent", text: "Perfect. Aarav will be there with me. Also, his attendance has been quite good this month — happy to see!", time: "9:43 AM" },
  { from: "me",     text: "He's been very consistent, and his algebra scores have improved 12 points over the last unit test.", time: "9:51 AM" },
  { from: "parent", text: "Thanks for the update!", time: "10:02 AM" },
];
function PageParentMessages() {
  const [active, setActive] = React.useState(0);
  const t = THREADS[active];
  return (
    <div>
      <div className="page-head">
        <div><h1>Parent messages</h1><div className="sub">Conversations with parents. They see and reply to these in the Parent portal.</div></div>
        <div className="actions">
          <Button variant="secondary" icon="megaphone">New announcement</Button>
          <Button variant="primary" icon="message-square-plus">New message</Button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 280px", border: "1px solid var(--divider-row)", borderRadius: 12, background: "#FFF", overflow: "hidden", boxShadow: "var(--shadow-sm)", minHeight: 560 }}>
        <div style={{ borderRight: "1px solid var(--divider-row)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: "1px solid var(--divider-row)" }}>
            <div style={{ height: 32, background: "var(--bg-app)", borderRadius: 8, padding: "0 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="search" size={14} color="#6B7280" />
              <input style={{ background: "transparent", border: "none", outline: "none", flex: 1, font: "400 13px var(--font-sans)" }} placeholder="Search parents" />
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {THREADS.map((th, i) => (
              <div key={i} onClick={() => setActive(i)} style={{
                padding: "12px 14px", display: "flex", gap: 10, cursor: "pointer",
                borderBottom: "1px solid var(--divider-row)",
                background: i === active ? "var(--bg-selected)" : "transparent",
                borderLeft: "3px solid " + (i === active ? "var(--eduos-primary)" : "transparent"),
              }}>
                <Avatar name={th.parent} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{th.parent}</div>
                    <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{th.when}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{th.child}'s parent</div>
                  <div style={{ fontSize: 12, color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 4 }}>{th.last}</div>
                </div>
                {th.unread > 0 && <span style={{ background: "var(--eduos-primary)", color: "#FFF", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "2px 6px", minWidth: 18, textAlign: "center", height: 18, alignSelf: "center" }}>{th.unread}</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider-row)", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={t.parent} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{t.parent}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Parent of {t.child} · 7-A</div>
            </div>
            <button className="icon-btn" title="Call"><Icon name="phone" size={16} /></button>
            <button className="icon-btn" title="More"><Icon name="more-horizontal" size={16} /></button>
          </div>
          <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 12, background: "var(--bg-app)", overflowY: "auto" }}>
            {MESSAGES.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%",
                  background: m.from === "me" ? "var(--eduos-primary)" : "#FFF",
                  color: m.from === "me" ? "#FFF" : "var(--fg-1)",
                  border: m.from === "me" ? "none" : "1px solid var(--divider-row)",
                  borderRadius: m.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "10px 14px", fontSize: 14, lineHeight: "20px",
                }}>
                  <div>{m.text}</div>
                  <div style={{ fontSize: 11, opacity: m.from === "me" ? 0.8 : 1, color: m.from === "me" ? "#FFF" : "var(--fg-3)", marginTop: 4, textAlign: "right" }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 14, borderTop: "1px solid var(--divider-row)", display: "flex", gap: 10, alignItems: "center" }}>
            <button className="icon-btn"><Icon name="paperclip" size={18} /></button>
            <input className="input" placeholder="Write a reply…" style={{ flex: 1 }} />
            <Button variant="primary" icon="send">Send</Button>
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--divider-row)", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <Avatar name={t.child} />
            <div style={{ fontWeight: 600, fontSize: 15, marginTop: 8 }}>{t.child}</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Class 7-A · Roll 7A-01</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
            <div style={{ background: "var(--bg-app)", padding: 10, borderRadius: 8 }}><div style={{ color: "var(--fg-3)" }}>Attendance</div><div style={{ fontWeight: 700, fontSize: 18, color: "var(--eduos-success)" }}>96%</div></div>
            <div style={{ background: "var(--bg-app)", padding: 10, borderRadius: 8 }}><div style={{ color: "var(--fg-3)" }}>Avg. score</div><div style={{ fontWeight: 700, fontSize: 18 }}>86</div></div>
            <div style={{ background: "var(--bg-app)", padding: 10, borderRadius: 8 }}><div style={{ color: "var(--fg-3)" }}>Fees</div><div style={{ fontWeight: 700, fontSize: 13, color: "var(--eduos-success)", marginTop: 6 }}>Paid</div></div>
            <div style={{ background: "var(--bg-app)", padding: 10, borderRadius: 8 }}><div style={{ color: "var(--fg-3)" }}>Last exam</div><div style={{ fontWeight: 700, fontSize: 13, marginTop: 6 }}>A · 92</div></div>
          </div>
          <div>
            <div className="t-micro" style={{ marginBottom: 8 }}>Shared with parent</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              {[["file-text","Term 1 report card","May 10"],["receipt","Invoice INV-2026-101","May 12"],["calendar","PTM · Fri May 29","May 22"]].map(([i, l, d]) => (
                <div key={l} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Icon name={i} size={14} color="#6B7280" /><div style={{ flex: 1 }}>{l}</div><span style={{ color: "var(--fg-3)", fontSize: 11 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.PageParentMessages = PageParentMessages;
