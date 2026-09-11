/* EduOS UI Kit — shared primitives + helpers
   Exposes globally for the other JSX files. */

const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Lucide icon ---------- */
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.6, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      try { window.lucide.createIcons({ attrs: { width: size, height: size, "stroke-width": strokeWidth, stroke: color } }); } catch {}
    }
  }, [name, size, color, strokeWidth]);
  return <span ref={ref} className="lucide-wrap" style={{ display: "inline-flex", width: size, height: size, ...style }} />;
}

/* ---------- Button ---------- */
function Button({ variant = "secondary", size = "md", icon, children, onClick, disabled, type, style }) {
  const cls = `btn btn-${variant}${size !== "md" ? " btn-" + size : ""}`;
  return (
    <button className={cls} disabled={disabled} type={type} onClick={onClick} style={style}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

/* ---------- Badge ---------- */
function Badge({ tone = "neutral", children, dot = true }) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

/* ---------- Avatar ---------- */
const AV_COLORS = ["#2F6FED", "#16A34A", "#D97706", "#7C3AED", "#0284C7", "#DC2626", "#475569", "#0891B2"];
function avColor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}
function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function Avatar({ name, size = "md" }) {
  return <span className={`av ${size === "sm" ? "sm" : ""}`} style={{ background: avColor(name) }}>{initials(name)}</span>;
}

/* ---------- Card ---------- */
function Card({ children, title, sub, actions, pad = true, style }) {
  return (
    <div className="card" style={style}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
        </div>
      )}
      <div className={pad ? "card-body" : ""}>{children}</div>
    </div>
  );
}

/* ---------- KPI ---------- */
function KPI({ icon, label, value, delta, deltaTone = "up", footer }) {
  return (
    <div className="kpi">
      <div className="row">
        <span className="glyph"><Icon name={icon} size={18} color="#2F6FED" /></span>
        <span className="label">{label}</span>
      </div>
      <div className="value">{value}</div>
      {(delta || footer) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {delta && (
            <span className={`delta ${deltaTone}`}>
              <Icon name={deltaTone === "up" ? "trending-up" : deltaTone === "down" ? "trending-down" : "minus"} size={12} />
              {delta}
            </span>
          )}
          {footer && <span className="muted" style={{ fontSize: 12 }}>{footer}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- Tabs / Segmented ---------- */
function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(o => (
        <button key={o.value} className={o.value === value ? "active" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- Toggle ---------- */
function Toggle({ on, onChange }) {
  return <div className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} />;
}

/* ---------- Inline sparkline (SVG) ---------- */
function Sparkline({ values, color = "#2F6FED", width = 120, height = 32 }) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const a = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={a} fill={color} opacity="0.10" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

/* ---------- Bar chart ---------- */
function BarChart({ data, height = 200, color = "#2F6FED", yTicks = 4 }) {
  const max = Math.max(...data.map(d => d.value));
  const niceMax = Math.ceil(max / 10) * 10 || 10;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height, padding: "0 4px", borderBottom: "1px solid var(--border-default)", position: "relative" }}>
        {Array.from({ length: yTicks }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, bottom: `${(i / (yTicks - 1)) * 100}%`, borderTop: "1px dashed #EEF0F3", pointerEvents: "none" }} />
        ))}
        {data.map((d, i) => {
          const h = (d.value / niceMax) * (height - 10);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{d.value}</div>
              <div style={{ width: "100%", maxWidth: 28, height: h, background: color, borderRadius: "6px 6px 0 0", opacity: d.dim ? 0.35 : 1 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, padding: "8px 4px 0" }}>
        {data.map((d, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--fg-3)" }}>{d.label}</div>)}
      </div>
    </div>
  );
}

/* ---------- Donut ---------- */
function Donut({ segments, size = 140, thickness = 18, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF0F3" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="butt" />
        );
        acc += len;
        return el;
      })}
      {centerValue && (
        <g>
          <text x={size/2} y={size/2 - 2} textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="22" fill="#0F172A">{centerValue}</text>
          {centerLabel && <text x={size/2} y={size/2 + 16} textAnchor="middle" fontFamily="Inter" fontSize="11" fill="#6B7280">{centerLabel}</text>}
        </g>
      )}
    </svg>
  );
}

/* ---------- Modal ---------- */
function Modal({ open, onClose, title, sub, children, footer, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, boxShadow: "var(--shadow-md)", width, maxWidth: "100%", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ font: "600 18px/24px var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
            {sub && <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
        {footer && <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "flex-end", gap: 10, background: "#FAFBFC" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
function Empty({ icon, title, sub, action }) {
  return (
    <div className="empty">
      <span className="glyph"><Icon name={icon} size={24} color="#2F6FED" /></span>
      <h3>{title}</h3>
      {sub && <div style={{ maxWidth: 340 }}>{sub}</div>}
      {action}
    </div>
  );
}

/* ---------- expose globally ---------- */
Object.assign(window, { Icon, Button, Badge, Avatar, Card, KPI, Segmented, Toggle, Sparkline, BarChart, Donut, Modal, Empty, avColor, initials });
