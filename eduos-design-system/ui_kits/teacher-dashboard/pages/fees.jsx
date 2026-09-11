
const FEE_ROWS = [
  { name: "Aarav Sharma",  roll: "7A-01", parent: "Rahul Sharma",  invoice: "INV-2026-101", amount: 4500,  due: "May 15", paid: "May 12", state: "Paid" },
  { name: "Priya Verma",   roll: "7A-02", parent: "Sunita Verma",  invoice: "INV-2026-102", amount: 4500,  due: "May 15", paid: "May 14", state: "Paid" },
  { name: "Rohan Iyer",    roll: "7A-03", parent: "Vikram Iyer",   invoice: "INV-2026-103", amount: 4500,  due: "May 15", paid: null,     state: "Overdue" },
  { name: "Maya Krishnan", roll: "7A-04", parent: "Lakshmi K.",    invoice: "INV-2026-104", amount: 4500,  due: "May 15", paid: "May 13", state: "Paid" },
  { name: "Kabir Singh",   roll: "7A-05", parent: "Manjeet Singh", invoice: "INV-2026-105", amount: 4500,  due: "May 30", paid: null,     state: "Due" },
  { name: "Dev Mehta",     roll: "7A-07", parent: "Nilesh Mehta",  invoice: "INV-2026-107", amount: 6800,  due: "May 30", paid: null,     state: "Due" },
  { name: "Aryan Kapoor",  roll: "7A-09", parent: "Sanjay Kapoor", invoice: "INV-2026-109", amount: 9000,  due: "Apr 30", paid: null,     state: "Overdue" },
  { name: "Saanvi Rao",    roll: "7A-10", parent: "Kiran Rao",     invoice: "INV-2026-110", amount: 4500,  due: "May 15", paid: "May 09", state: "Paid" },
];
function StateBadge({ s }) {
  if (s === "Paid")    return <Badge tone="success">Paid</Badge>;
  if (s === "Due")     return <Badge tone="warning">Due</Badge>;
  if (s === "Overdue") return <Badge tone="danger">Overdue</Badge>;
  return <Badge tone="neutral">{s}</Badge>;
}
function rupee(n) { return "₹" + n.toLocaleString("en-IN"); }
function PageFees() {
  const [filter, setFilter] = React.useState("all");
  const rows = FEE_ROWS.filter(r => filter === "all" || r.state.toLowerCase() === filter);
  const totals = FEE_ROWS.reduce((a, r) => {
    a.total += r.amount;
    if (r.state === "Paid") a.collected += r.amount; else a.outstanding += r.amount;
    if (r.state === "Overdue") a.overdue += r.amount;
    return a;
  }, { total: 0, collected: 0, outstanding: 0, overdue: 0 });
  return (
    <div>
      <div className="page-head">
        <div><h1>Fees</h1><div className="sub">May 2026 · 7-A tuition</div></div>
        <div className="actions">
          <Button variant="secondary" icon="download">Export</Button>
          <Button variant="secondary" icon="bell">Send reminder</Button>
          <Button variant="primary" icon="plus">New invoice</Button>
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI icon="indian-rupee" label="Collected"    value={rupee(totals.collected)}   delta="71%" deltaTone="up" />
        <KPI icon="hourglass"    label="Outstanding"  value={rupee(totals.outstanding)} delta="29%" deltaTone="down" />
        <KPI icon="circle-alert" label="Overdue"      value={rupee(totals.overdue)}     delta="2 students" deltaTone="down" />
        <KPI icon="receipt"      label="Total billed" value={rupee(totals.total)}       footer="May 2026" />
      </div>
      <div className="toolbar">
        <Segmented value={filter} onChange={setFilter} options={[
          { label: "All", value: "all" }, { label: "Paid", value: "paid" },
          { label: "Due", value: "due" }, { label: "Overdue", value: "overdue" },
        ]} />
        <div className="search"><Icon name="search" size={14} color="#6B7280" /><input placeholder="Search by student or invoice" /></div>
        <span style={{ marginLeft: "auto", color: "var(--fg-3)", fontSize: 13 }}>{rows.length} invoices</span>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Student</th><th>Invoice</th><th>Due date</th><th>Paid on</th>
            <th>Status</th><th className="num">Amount</th><th style={{ width: 120 }}></th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.invoice}>
                <td><div className="av-row"><Avatar name={r.name} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="secondary">{r.parent}</div></div></div></td>
                <td className="secondary" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.invoice}</td>
                <td>{r.due}</td>
                <td className="secondary">{r.paid || "—"}</td>
                <td><StateBadge s={r.state} /></td>
                <td className="num" style={{ fontWeight: 600 }}>{rupee(r.amount)}</td>
                <td>{r.state !== "Paid" ? <Button variant="ghost" size="sm" icon="check">Mark paid</Button> : <Button variant="ghost" size="sm" icon="external-link">Receipt</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
window.PageFees = PageFees;
