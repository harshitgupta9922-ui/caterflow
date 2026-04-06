import { useState, useEffect, useCallback } from "react";

// ── API CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://slategrey-ant-868256.hostingersite.com/api";

// ── API HELPER ────────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const token = localStorage.getItem("cf_token");
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  // Server returns { success: true, data: ... }
  return json.data !== undefined ? json.data : json;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmt        = (n)  => "Rs." + Number(n).toLocaleString("en-IN");
const fmtDate    = (d)  => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const todayStr   = ()   => new Date().toISOString().split("T")[0];
const getMonth   = (d)  => d.substring(0, 7);

// ── STYLES ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0f0d; --surface: #111815; --card: #161e1a; --border: #1f2d27;
    --accent: #00e676; --accent2: #69f0ae; --accent3: #ff6b35;
    --text: #e8f5e9; --muted: #6b8c76; --danger: #ff5252; --warning: #ffab40; --info: #40c4ff;
  }
  body { font-family: 'Epilogue', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }

  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at 30% 20%, #0d2a1a 0%, var(--bg) 60%); }
  .login-box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 48px; width: 420px; box-shadow: 0 0 60px rgba(0,230,118,0.05); }
  .login-logo { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--accent); margin-bottom: 4px; }
  .login-sub  { color: var(--muted); font-size: 13px; margin-bottom: 36px; }

  .fg { margin-bottom: 18px; }
  .fg label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .fg input, .fg select { width: 100%; padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'Epilogue', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
  .fg input:focus, .fg select:focus { border-color: var(--accent); }
  .fg select option { background: var(--surface); }

  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; transition: all 0.2s; }
  .btn-p { background: var(--accent); color: #000; }
  .btn-p:hover { background: var(--accent2); transform: translateY(-1px); }
  .btn-s { background: var(--border); color: var(--text); }
  .btn-s:hover { background: #2a3d33; }
  .btn-d { background: rgba(255,82,82,0.15); color: var(--danger); border: 1px solid rgba(255,82,82,0.3); }
  .btn-d:hover { background: rgba(255,82,82,0.25); }
  .btn-sm { padding: 7px 14px; font-size: 12px; }
  .btn-fw { width: 100%; justify-content: center; }

  .app-layout   { display: flex; min-height: 100vh; }
  .main-content { margin-left: 240px; flex: 1; min-height: 100vh; }

  .sidebar { width: 240px; min-height: 100vh; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; }
  .sb-brand { padding: 24px 20px; border-bottom: 1px solid var(--border); }
  .sb-brand-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--accent); }
  .sb-brand-role { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .sb-nav   { flex: 1; padding: 16px 12px; overflow-y: auto; }
  .nav-sec  { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; padding: 12px 8px 6px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; margin-bottom: 2px; }
  .nav-item:hover  { background: var(--border); color: var(--text); }
  .nav-item.active { background: rgba(0,230,118,0.12); color: var(--accent); font-weight: 600; }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .sb-footer { padding: 16px 12px; border-top: 1px solid var(--border); }
  .user-chip   { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: var(--card); }
  .user-av     { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #000; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; }
  .user-nm     { font-size: 12px; font-weight: 600; }
  .user-rl     { font-size: 10px; color: var(--muted); }

  .ph   { padding: 28px 32px 0; }
  .ptit { font-size: 26px; font-weight: 800; }
  .psub { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .pb   { padding: 24px 32px; }

  .card   { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .ctit   { font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .card-c { cursor: pointer; transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s; }
  .card-c:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,230,118,0.08); }

  .sgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .scard { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; position: relative; overflow: hidden; }
  .scard::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--sc, var(--accent)); }
  .sval  { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; }
  .slbl  { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .sico  { font-size: 28px; position: absolute; right: 20px; top: 20px; opacity: 0.2; }

  .tw { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
  tbody td { padding: 12px 14px; border-bottom: 1px solid rgba(31,45,39,0.6); }
  tbody tr:hover { background: rgba(255,255,255,0.02); }
  tbody tr:last-child td { border-bottom: none; }

  .bdg   { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
  .bg    { background: rgba(0,230,118,0.12);  color: var(--accent);  }
  .bo    { background: rgba(255,107,53,0.12); color: var(--accent3); }
  .bb    { background: rgba(64,196,255,0.12); color: var(--info);    }

  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  @media (max-width: 900px) { .g2, .g3 { grid-template-columns: 1fr; } }

  .mo { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .mb { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
  .mbt { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 20px; }
  .mbf { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }

  .pb2 { height: 6px; background: var(--border); border-radius: 4px; overflow: hidden; }
  .pf  { height: 100%; border-radius: 4px; background: var(--accent); transition: width 0.3s; }

  .fr { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; align-items: flex-end; }
  .fr .fg { margin-bottom: 0; min-width: 160px; }

  .al  { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .ale { background: rgba(255,82,82,0.1);  border: 1px solid rgba(255,82,82,0.2);  color: var(--danger); }
  .als { background: rgba(0,230,118,0.1);  border: 1px solid rgba(0,230,118,0.2);  color: var(--accent); }

  .bc { display: flex; align-items: flex-end; gap: 4px; height: 120px; }
  .bi { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .bb2 { width: 100%; border-radius: 4px 4px 0 0; background: var(--accent); min-height: 4px; }
  .bl { font-size: 9px; color: var(--muted); }

  .vbc { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: border-color 0.2s, transform 0.15s; }
  .vbc:hover { border-color: var(--accent); transform: translateY(-1px); }
  .vbc-on { border-color: var(--accent) !important; background: rgba(0,230,118,0.04) !important; }
  .vav { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--info)); color: #000; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; flex-shrink: 0; }
  .vbs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); text-align: center; }
  .vbv { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; }
  .vbl { font-size: 10px; color: var(--muted); margin-top: 2px; }

  .pir { display: grid; grid-template-columns: 1fr 80px 100px 36px; gap: 10px; align-items: center; margin-bottom: 10px; }

  .back { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; cursor: pointer; margin-bottom: 20px; transition: color 0.15s; }
  .back:hover { color: var(--text); }
  .div  { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .emp  { text-align: center; padding: 48px 20px; color: var(--muted); }
  .eic  { font-size: 48px; margin-bottom: 12px; }

  .df  { display: flex; }
  .aic { align-items: center; }
  .jb  { justify-content: space-between; }
  .g10 { gap: 10px; }
  .g14 { gap: 14px; }
  .mb12 { margin-bottom: 12px; }
  .mb16 { margin-bottom: 16px; }
  .mb20 { margin-bottom: 20px; }
  .mb24 { margin-bottom: 24px; }
  .tr   { text-align: right; }
  .ta   { color: var(--accent); font-family: 'Syne', sans-serif; font-weight: 700; }
  .tm   { color: var(--muted); }
  .ts   { font-size: 12px; }
`;

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [busy,  setBusy]        = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter username and password"); return; }
    setBusy(true); setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message || "Invalid username or password");
    }
    setBusy(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">CaterFlow</div>
        <div className="login-sub">Catering Management System</div>
        {error && <div className="al ale">{error}</div>}
        <div className="fg">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        </div>
        <div className="fg">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        </div>
        <button className="btn btn-p btn-fw" onClick={handleLogin} disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
        <hr className="div" />
        <div className="ts tm">
          <strong>Demo Credentials:</strong><br />
          Admin: admin / admin123<br />
          Vendor: vendor1 / vendor123
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════════════════════
function Sidebar({ currentUser, activePage, onNavigate, onLogout }) {
  const adminOverview = [
    { key: "dashboard", label: "Dashboard"     },
    { key: "clients",   label: "Clients"       },
    { key: "inventory", label: "Inventory"     },
    { key: "purchases", label: "All Purchases" },
    { key: "reports",   label: "Reports"       },
  ];
  const adminManage = [
    { key: "manage-clients",   label: "Clients"          },
    { key: "manage-items",     label: "Grocery Items"    },
    { key: "manage-users",     label: "Users / Vendors"  },
    { key: "manage-purchases", label: "Purchase Entries" },
    { key: "manage-returns",   label: "Return Entries"   },
  ];
  const vendorNav = [
    { key: "vendor-dashboard", label: "My Dashboard"   },
    { key: "add-purchase",     label: "Add Daily Entry" },
    { key: "my-purchases",     label: "My Entries"     },
    { key: "manage-my-purchases", label: "Purchase Entries" },
    { key: "add-return",       label: "Add Return Entry" },
    { key: "my-returns",       label: "My Returns"      },
  ];

  return (
    <div className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-name">CaterFlow</div>
        <div className="sb-brand-role">{currentUser.role === "admin" ? "Admin Panel" : "Vendor Portal"}</div>
      </div>
      <div className="sb-nav">
        {currentUser.role === "admin" ? (
          <>
            <div className="nav-sec">Overview</div>
            {adminOverview.map((item) => (
              <div key={item.key} className={"nav-item" + (activePage === item.key ? " active" : "")} onClick={() => onNavigate(item.key)}>
                {item.label}
              </div>
            ))}
            <div className="nav-sec">Manage Data</div>
            {adminManage.map((item) => (
              <div key={item.key} className={"nav-item" + (activePage === item.key ? " active" : "")} onClick={() => onNavigate(item.key)}>
                {item.label}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="nav-sec">Navigation</div>
            {vendorNav.map((item) => (
              <div key={item.key} className={"nav-item" + (activePage === item.key ? " active" : "")} onClick={() => onNavigate(item.key)}>
                {item.label}
              </div>
            ))}
          </>
        )}
      </div>
      <div className="sb-footer">
        <div className="user-chip">
          <div className="user-av">{currentUser.name[0]}</div>
          <div>
            <div className="user-nm">{currentUser.name}</div>
            <div className="user-rl">{currentUser.role}</div>
          </div>
        </div>
        <button className="btn btn-d btn-fw" style={{ marginTop: 10 }} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ purchases, clients }) {
  const getClient = (id) => clients.find(c => c.id === id);
  const today     = todayStr();
  const thisMonth = getMonth(today);
  const todayP    = purchases.filter((p) => p.date === today);
  const monthP    = purchases.filter((p) => getMonth(p.date) === thisMonth);
  const ttDay     = todayP.reduce((s, p) => s + p.totalAmount, 0);
  const ttMonth   = monthP.reduce((s, p) => s + p.totalAmount, 0);
  const ttPpl     = monthP.reduce((s, p) => s + (p.peopleCount || 0), 0);
  const avgPP     = ttPpl ? Math.round(ttMonth / ttPpl) : 0;

  const clientStats = clients.map((c) => {
    const cp  = monthP.filter((p) => p.clientId === c.id);
    return { ...c, total: cp.reduce((s, p) => s + p.totalAmount, 0) };
  }).sort((a, b) => b.total - a.total);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    const total = purchases.filter((p) => p.date === ds).reduce((s, p) => s + p.totalAmount, 0);
    return { label: d.toLocaleDateString("en", { weekday: "short" }), total };
  });
  const maxBar = Math.max(...last7.map((d) => d.total), 1);
  const recent = [...purchases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div>
      <div className="ph"><div className="ptit">Dashboard</div><div className="psub">Overview of all catering operations</div></div>
      <div className="pb">
        <div className="sgrid">
          {[
            { label: "Today's Spend",        value: fmt(ttDay),   icon: "Rs", color: "var(--accent)"  },
            { label: "Month Spend",           value: fmt(ttMonth), icon: "M",  color: "var(--info)"    },
            { label: "People Served (Month)", value: ttPpl.toLocaleString(), icon: "P", color: "var(--accent3)" },
            { label: "Avg Cost / Person",     value: fmt(avgPP),   icon: "~",  color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="scard" style={{ "--sc": s.color }}>
              <div className="sico" style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20 }}>{s.icon}</div>
              <div className="sval">{s.value}</div>
              <div className="slbl">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="g2 mb24">
          <div className="card">
            <div className="ctit">Last 7 Days Spend</div>
            <div className="bc">
              {last7.map((d) => (
                <div key={d.label} className="bi">
                  <div className="bb2" style={{ height: `${(d.total / maxBar) * 100}px` }} title={fmt(d.total)} />
                  <div className="bl">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="ctit">This Month - By Client</div>
            {clientStats.map((c) => (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div className="df jb aic" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                  <span className="ta" style={{ fontSize: 13 }}>{fmt(c.total)}</span>
                </div>
                <div className="pb2"><div className="pf" style={{ width: clientStats[0].total ? `${(c.total / clientStats[0].total) * 100}%` : "0%" }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="ctit">Recent Purchases</div>
          <div className="tw">
            <table>
              <thead><tr><th>Date</th><th>Client</th><th>Vendor</th><th>People</th><th>Amount</th></tr></thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td>{getClient(p.clientId)?.name}</td>
                    <td><span className="bdg bg">{p.addedBy}</span></td>
                    <td>{p.peopleCount || "—"}</td>
                    <td className="ta">{fmt(p.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENT DETAIL
// ══════════════════════════════════════════════════════════════════════════════
function ClientDetailPage({ client, purchases, users, onBack }) {
  const [selVendorId, setSelVendorId] = useState(null);
  const [mf, setMf]                   = useState(getMonth(todayStr()));

  const cp       = purchases.filter((p) => p.clientId === client.id);
  const months   = [...new Set(cp.map((p) => getMonth(p.date)))].sort().reverse();
  const filtered = cp.filter((p) => !mf || getMonth(p.date) === mf);
  const vendors  = users.filter((u) => u.role === "vendor" && u.clientId === client.id);
  const gTotal   = filtered.reduce((s, p) => s + p.totalAmount, 0);
  const gPpl     = filtered.reduce((s, p) => s + (p.peopleCount || 0), 0);

  const vStats = vendors.map((v) => {
    const vp      = filtered.filter((p) => p.addedBy === v.username);
    const bill    = vp.reduce((s, p) => s + p.totalAmount, 0);
    const ppl     = vp.reduce((s, p) => s + (p.peopleCount || 0), 0);
    const sorted  = [...vp].sort((a, b) => b.date.localeCompare(a.date));
    return { ...v, bill, ppl, entries: vp.length, lastDate: sorted[0]?.date || null };
  });

  const selV  = vendors.find((v) => v.id === selVendorId) || null;
  const selVP = selV ? [...filtered.filter((p) => p.addedBy === selV.username)].sort((a, b) => b.date.localeCompare(a.date)) : [];

  return (
    <div>
      <div className="ph">
        <div className="back" onClick={onBack}>back to Clients</div>
        <div className="df aic g14">
          <div style={{ fontSize: 36 }}>{client.type === "Hospital" ? "H" : "M"}</div>
          <div>
            <div className="ptit">{client.name}</div>
            <div className="psub">
              <span className={"bdg " + (client.type === "Hospital" ? "bb" : "bo")} style={{ marginRight: 8 }}>{client.type}</span>
              {client.location}
            </div>
          </div>
        </div>
      </div>

      <div className="pb">
        <div className="fr">
          <div className="fg">
            <label>Month</label>
            <select value={mf} onChange={(e) => { setMf(e.target.value); setSelVendorId(null); }}>
              <option value="">All Time</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="sgrid mb24">
          {[
            { label: "Total Billing",  value: fmt(gTotal),             color: "var(--accent)"  },
            { label: "Vendors Active", value: vStats.filter(v => v.entries > 0).length, color: "var(--info)" },
            { label: "People Served",  value: gPpl.toLocaleString(),   color: "var(--accent3)" },
            { label: "Avg / Person",   value: gPpl ? fmt(Math.round(gTotal / gPpl)) : "N/A", color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="scard" style={{ "--sc": s.color }}>
              <div className="sval">{s.value}</div>
              <div className="slbl">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Vendor Billing — Click a card to see purchase entries
        </div>

        <div className="g2 mb24">
          {vendors.length === 0 ? (
            <div className="emp"><div className="eic">?</div><div>No vendors assigned</div></div>
          ) : vStats.map((v) => {
            const isOn = selVendorId === v.id;
            return (
              <div key={v.id} className={"vbc" + (isOn ? " vbc-on" : "")} onClick={() => setSelVendorId(isOn ? null : v.id)}>
                <div className="df jb aic mb16">
                  <div className="df aic g10" style={{ gap: 12 }}>
                    <div className="vav">{v.name[0]}</div>
                    <div>
                      <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>{v.name}</div>
                      <div className="ts tm">@{v.username}</div>
                    </div>
                  </div>
                  <div className="tr">
                    <div className="ta" style={{ fontSize: 22 }}>{fmt(v.bill)}</div>
                    <div className="ts tm">Total Billed</div>
                  </div>
                </div>

                <div className="pb2 mb12">
                  <div className="pf" style={{ width: gTotal ? `${(v.bill / gTotal) * 100}%` : "0%" }} />
                </div>
                <div className="ts tm mb12">{gTotal ? Math.round((v.bill / gTotal) * 100) : 0}% of client total</div>

                <div className="vbs">
                  <div><div className="vbv">{v.entries}</div><div className="vbl">Entries</div></div>
                  <div><div className="vbv">{v.ppl.toLocaleString()}</div><div className="vbl">People Served</div></div>
                  <div><div className="vbv">{v.lastDate ? fmtDate(v.lastDate).split(" ").slice(0,2).join(" ") : "N/A"}</div><div className="vbl">Last Entry</div></div>
                </div>

                <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: isOn ? "var(--accent)" : "var(--muted)" }}>
                  {isOn ? "^ Hide entries" : "v View purchase entries"}
                </div>
              </div>
            );
          })}
        </div>

        {selV && (
          <div className="card" style={{ borderColor: "rgba(0,230,118,0.25)" }}>
            <div className="df jb aic mb16">
              <div>
                <div className="ctit" style={{ marginBottom: 2 }}>Purchase Entries — {selV.name}</div>
                <div className="ts tm">{selVP.length} entries {mf ? "in " + mf : "all time"}</div>
              </div>
              <div className="tr">
                <div className="ta" style={{ fontSize: 20 }}>{fmt(selVP.reduce((s, p) => s + p.totalAmount, 0))}</div>
                <div className="ts tm">Total</div>
              </div>
            </div>
            {selVP.length === 0 ? (
              <div className="emp" style={{ padding: 24 }}><div className="eic">-</div><div>No entries for this period</div></div>
            ) : (
              <div className="tw">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Items Purchased</th><th>People</th><th>Amount</th><th>Avg/Person</th></tr>
                  </thead>
                  <tbody>
                    {selVP.map((p) => (
                      <tr key={p.id}>
                        <td>{fmtDate(p.date)}</td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {p.items.map((item, i) => (
                              <span key={i} className="bdg bb" style={{ fontSize: 10 }}>
                                {getGrocery(item.groceryId)?.name} {item.qty}{getGrocery(item.groceryId)?.unit}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{p.peopleCount || "—"}</td>
                        <td className="ta">{fmt(p.totalAmount)}</td>
                        <td className="tm">{p.peopleCount ? fmt(Math.round(p.totalAmount / p.peopleCount)) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENTS LIST
// ══════════════════════════════════════════════════════════════════════════════
function ClientsPage({ purchases, clients, users }) {
  const [selClient, setSelClient] = useState(null);

  if (selClient) {
    return <ClientDetailPage client={selClient} purchases={purchases} users={users} onBack={() => setSelClient(null)} />;
  }

  const clientStats = clients.map((c) => {
    const cp         = purchases.filter((p) => p.clientId === c.id);
    const totalSpend = cp.reduce((s, p) => s + p.totalAmount, 0);
    const totalPpl   = cp.reduce((s, p) => s + (p.peopleCount || 0), 0);
    const vCount     = users.filter((u) => u.role === "vendor" && u.clientId === c.id).length;
    return { ...c, totalSpend, totalPpl, vCount };
  });

  return (
    <div>
      <div className="ph">
        <div className="ptit">Clients</div>
        <div className="psub">Click on a client to view vendors and billing details</div>
      </div>
      <div className="pb">
        <div className="g3">
          {clientStats.map((c) => (
            <div key={c.id} className="card card-c" onClick={() => setSelClient(c)}>
              <div className="df aic g10 mb16">
                <div style={{ fontSize: 32 }}>{c.type === "Hospital" ? "+" : "H"}</div>
                <div>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <span className={"bdg " + (c.type === "Hospital" ? "bb" : "bo")}>{c.type}</span>
                </div>
              </div>
              <div className="ts tm mb12">{c.location}</div>
              <hr className="div" style={{ margin: "12px 0" }} />
              <div className="g2" style={{ gap: 10, marginBottom: 12 }}>
                <div><div className="ta" style={{ fontSize: 18 }}>{fmt(c.totalSpend)}</div><div className="ts tm">Total Spend</div></div>
                <div><div className="ta" style={{ fontSize: 18 }}>{c.totalPpl.toLocaleString()}</div><div className="ts tm">People Served</div></div>
              </div>
              <div className="df jb aic">
                <div className="ts tm">{c.vCount} vendor{c.vCount !== 1 ? "s" : ""}</div>
                <div className="ts ta">View details</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVENTORY — DAILY WISE
// ══════════════════════════════════════════════════════════════════════════════
function InventoryPage({ purchases, clients, groceryItems }) {
  const getClient = (id) => clients.find(c => c.id === id);
  const [view,      setView]      = useState("daily");   // "daily" | "summary"
  const [cf,        setCf]        = useState("ALL");
  const [mf,        setMf]        = useState(getMonth(todayStr()));
  const [selDate,   setSelDate]   = useState(null);
  const [selItem,   setSelItem]   = useState("ALL");

  const months = [...new Set(purchases.map((p) => getMonth(p.date)))].sort().reverse();

  // Filter purchases
  const filtered = purchases.filter((p) =>
    (cf === "ALL" || p.clientId === cf) &&
    (!mf || getMonth(p.date) === mf)
  );

  // ── DAILY VIEW ────────────────────────────────────────────────────────────
  // Group by date
  const dateMap = {};
  filtered.forEach((p) => {
    if (!dateMap[p.date]) dateMap[p.date] = { purchases: [], totalPpl: 0, totalSpend: 0 };
    dateMap[p.date].purchases.push(p);
    dateMap[p.date].totalPpl   += (p.peopleCount || 0);
    dateMap[p.date].totalSpend += p.totalAmount;
  });

  const sortedDates = Object.keys(dateMap).sort().reverse();

  // Per-date item breakdown
  const getDayItems = (date) => {
    const dayPurchases = dateMap[date]?.purchases || [];
    const itemMap = {};
    dayPurchases.forEach((p) => {
      p.items.forEach((item) => {
        if (!itemMap[item.groceryId]) itemMap[item.groceryId] = { qty: 0, spend: 0, clients: new Set() };
        itemMap[item.groceryId].qty   += item.qty;
        itemMap[item.groceryId].spend += item.total;
        itemMap[item.groceryId].clients.add(p.clientId);
      });
    });
    return Object.entries(itemMap).map(([id, v]) => ({
      ...groceryItems.find((g) => g.id === id), ...v, clients: [...v.clients]
    })).sort((a, b) => b.spend - a.spend);
  };

  // ── SUMMARY VIEW ──────────────────────────────────────────────────────────
  const summaryMap = {};
  filtered.forEach((p) => p.items.forEach((item) => {
    if (!summaryMap[item.groceryId]) summaryMap[item.groceryId] = { qty: 0, spend: 0, days: new Set() };
    summaryMap[item.groceryId].qty   += item.qty;
    summaryMap[item.groceryId].spend += item.total;
    summaryMap[item.groceryId].days.add(p.date);
  }));
  const summaryRows = groceryItems
    .map((g) => ({ ...g, ...(summaryMap[g.id] ? { qty: summaryMap[g.id].qty, spend: summaryMap[g.id].spend, days: summaryMap[g.id].days.size } : { qty: 0, spend: 0, days: 0 }) }))
    .filter((g) => selItem === "ALL" || g.id === selItem)
    .sort((a, b) => b.spend - a.spend);

  const ttSpend = filtered.reduce((s, p) => s + p.totalAmount, 0);
  const ttPpl   = filtered.reduce((s, p) => s + (p.peopleCount || 0), 0);
  const ttItems = (() => { const s = new Set(); filtered.forEach(p => p.items.forEach(i => s.add(i.groceryId))); return s.size; })();

  return (
    <div>
      <div className="ph">
        <div className="ptit">Grocery Inventory</div>
        <div className="psub">Daily-wise purchase and consumption log</div>
      </div>
      <div className="pb">

        {/* Controls */}
        <div className="fr" style={{ marginBottom: 20, alignItems: "flex-end" }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", alignSelf: "flex-end" }}>
            {["daily", "summary"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "9px 18px", border: "none", cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, background: view === v ? "var(--accent)" : "transparent", color: view === v ? "#000" : "var(--muted)", transition: "all 0.2s" }}>
                {v === "daily" ? "Daily View" : "Summary View"}
              </button>
            ))}
          </div>
          <div className="fg">
            <label>Client</label>
            <select value={cf} onChange={(e) => { setCf(e.target.value); setSelDate(null); }}>
              <option value="ALL">All Clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Month</label>
            <select value={mf} onChange={(e) => { setMf(e.target.value); setSelDate(null); }}>
              <option value="">All Months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {view === "summary" && (
            <div className="fg">
              <label>Item</label>
              <select value={selItem} onChange={(e) => setSelItem(e.target.value)}>
                <option value="ALL">All Items</option>
                {groceryItems.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="sgrid mb24">
          {[
            { label: "Total Spend",    value: fmt(ttSpend),          color: "var(--accent)"  },
            { label: "People Served",  value: ttPpl.toLocaleString(),color: "var(--info)"    },
            { label: "Days Recorded",  value: sortedDates.length,    color: "var(--accent3)" },
            { label: "Unique Items",   value: ttItems,               color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="scard" style={{ "--sc": s.color }}>
              <div className="sval">{s.value}</div><div className="slbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── DAILY VIEW ── */}
        {view === "daily" && (
          <div>
            {sortedDates.length === 0 && <div className="emp"><div className="eic">-</div><div>No data for selected filters</div></div>}
            {sortedDates.map((date) => {
              const day      = dateMap[date];
              const dayItems = getDayItems(date);
              const isOpen   = selDate === date;
              const pplCount = day.totalPpl;
              const avgCost  = pplCount ? Math.round(day.totalSpend / pplCount) : 0;

              return (
                <div key={date} className="card" style={{ marginBottom: 12, borderColor: isOpen ? "rgba(0,230,118,0.3)" : "var(--border)" }}>
                  {/* Day Header — clickable */}
                  <div
                    onClick={() => setSelDate(isOpen ? null : date)}
                    style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div>
                        <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16 }}>{fmtDate(date)}</div>
                        <div className="ts tm" style={{ marginTop: 3 }}>
                          {day.purchases.length} purchase entr{day.purchases.length === 1 ? "y" : "ies"} &nbsp;·&nbsp; {dayItems.length} item types
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                      <div style={{ textAlign: "center" }}>
                        <div className="ta" style={{ fontSize: 18 }}>{pplCount.toLocaleString()}</div>
                        <div className="ts tm">People Served</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "var(--info)" }}>{fmt(avgCost)}</div>
                        <div className="ts tm">Avg / Person</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="ta" style={{ fontSize: 20 }}>{fmt(day.totalSpend)}</div>
                        <div className="ts tm">Total Purchased</div>
                      </div>
                      <div style={{ color: isOpen ? "var(--accent)" : "var(--muted)", fontSize: 18, fontWeight: 700 }}>
                        {isOpen ? "▲" : "▼"}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isOpen && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>

                      {/* Items Purchased */}
                      <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                        Items Purchased That Day
                      </div>
                      <div className="tw" style={{ marginBottom: 20 }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Category</th>
                              <th>Qty Purchased</th>
                              <th>Rate</th>
                              <th>Amount Spent</th>
                              <th>Clients</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayItems.map((item) => (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                <td><span className="bdg bb">{item.category}</span></td>
                                <td>
                                  <span style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--accent3)" }}>
                                    {item.qty.toFixed(1)}
                                  </span>
                                  <span className="ts tm"> {item.unit}</span>
                                </td>
                                <td className="tm ts">{fmt(item.spend / item.qty)}/unit</td>
                                <td className="ta">{fmt(item.spend)}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {item.clients.map((cid) => (
                                      <span key={cid} className="bdg bg" style={{ fontSize: 10 }}>{getClient(cid)?.name}</span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Consumption Summary */}
                      <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                        Consumption Summary
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                        {day.purchases.reduce((acc, p) => {
                          const existing = acc.find((a) => a.clientId === p.clientId);
                          if (existing) {
                            existing.spend  += p.totalAmount;
                            existing.ppl    += (p.peopleCount || 0);
                          } else {
                            acc.push({ clientId: p.clientId, spend: p.totalAmount, ppl: p.peopleCount || 0 });
                          }
                          return acc;
                        }, []).map((row) => (
                          <div key={row.clientId} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{getClient(row.clientId)?.name}</div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <div>
                                <div className="ta" style={{ fontSize: 16 }}>{row.ppl.toLocaleString()}</div>
                                <div className="ts tm">Consumed by</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div className="ta" style={{ fontSize: 16 }}>{fmt(row.spend)}</div>
                                <div className="ts tm">Spent</div>
                              </div>
                            </div>
                            {row.ppl > 0 && (
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--info)" }}>
                                Avg cost/person: <strong>{fmt(Math.round(row.spend / row.ppl))}</strong>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SUMMARY VIEW ── */}
        {view === "summary" && (
          <div className="card">
            <div className="ctit">Item-wise Summary {mf ? "— " + mf : ""}</div>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Days Used</th>
                    <th>Total Qty Purchased</th>
                    <th>Total Spend</th>
                    <th>Avg/Day</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((g, i) => (
                    <tr key={g.id}>
                      <td className="tm">{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{g.name}</td>
                      <td><span className="bdg bb">{g.category}</span></td>
                      <td>{g.unit}</td>
                      <td>{g.days}</td>
                      <td>
                        <span style={{ fontFamily: "Syne", fontWeight: 700, color: "var(--accent3)" }}>{g.qty.toFixed(1)}</span>
                        <span className="ts tm"> {g.unit}</span>
                      </td>
                      <td className="ta">{fmt(g.spend)}</td>
                      <td className="tm ts">{g.days ? (g.qty / g.days).toFixed(1) + " " + g.unit : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ALL PURCHASES
// ══════════════════════════════════════════════════════════════════════════════
function PurchasesPage({ purchases, clients, groceryItems }) {
  const getClient = (id) => clients.find(c => c.id === id);
  const [cf, setCf]     = useState("ALL");
  const [mf, setMf]     = useState("");
  const [sel, setSel]   = useState(null);

  const months   = [...new Set(purchases.map((p) => getMonth(p.date)))].sort().reverse();
  const filtered = purchases
    .filter((p) => (cf === "ALL" || p.clientId === cf) && (!mf || getMonth(p.date) === mf))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="ph"><div className="ptit">All Purchases</div><div className="psub">{filtered.length} entries</div></div>
      <div className="pb">
        <div className="fr">
          <div className="fg">
            <label>Client</label>
            <select value={cf} onChange={(e) => setCf(e.target.value)}>
              <option value="ALL">All Clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Month</label>
            <select value={mf} onChange={(e) => setMf(e.target.value)}>
              <option value="">All Months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="card">
          <div className="tw">
            <table>
              <thead><tr><th>Date</th><th>Client</th><th>Vendor</th><th>Items</th><th>People</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td style={{ fontWeight: 600 }}>{clients.find(c=>c.id===p.clientId)?.name}</td>
                    <td><span className="bdg bg">{p.addedBy}</span></td>
                    <td>{p.items.length}</td>
                    <td>{p.peopleCount || "—"}</td>
                    <td className="ta">{fmt(p.totalAmount)}</td>
                    <td><button className="btn btn-s btn-sm" onClick={() => setSel(p)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {sel && (
        <div className="mo" onClick={() => setSel(null)}>
          <div className="mb" onClick={(e) => e.stopPropagation()}>
            <div className="mbt">Purchase Details</div>
            <div style={{ marginBottom: 16, fontSize: 13, lineHeight: 2 }}>
              <div><span className="tm">Client: </span><strong>{getClient(sel.clientId)?.name}</strong></div>
              <div><span className="tm">Date: </span><strong>{fmtDate(sel.date)}</strong></div>
              <div><span className="tm">Vendor: </span><strong>{sel.addedBy}</strong></div>
              <div><span className="tm">People Served: </span><strong className="ta">{sel.peopleCount || "Not entered"}</strong></div>
            </div>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
              <tbody>
                {sel.items.map((item, i) => (
                  <tr key={i}>
                    <td>{getGrocery(item.groceryId)?.name}</td>
                    <td>{item.qty} {getGrocery(item.groceryId)?.unit}</td>
                    <td>Rs.{item.rate}</td>
                    <td className="ta">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="div" />
            <div className="df jb aic">
              <span className="tm">Total</span>
              <span className="ta" style={{ fontSize: 20 }}>{fmt(sel.totalAmount)}</span>
            </div>
            <div className="mbf"><button className="btn btn-s" onClick={() => setSel(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════════
function ReportsPage({ purchases, clients, groceryItems }) {
  const getClient = (id) => clients.find(c => c.id === id);
  const [rt, setRt] = useState("monthly");
  const [cf, setCf] = useState("ALL");
  const [mf, setMf] = useState(getMonth(todayStr()));

  const months   = [...new Set(purchases.map((p) => getMonth(p.date)))].sort().reverse();
  const filtered = purchases.filter((p) => (cf === "ALL" || p.clientId === cf) && (!mf || getMonth(p.date) === mf));

  const ttSpend = filtered.reduce((s, p) => s + p.totalAmount, 0);
  const ttPpl   = filtered.reduce((s, p) => s + (p.peopleCount || 0), 0);
  const avgPP   = ttPpl ? Math.round(ttSpend / ttPpl) : 0;
  const days    = [...new Set(filtered.map((p) => p.date))];

  const cBreak = clients.map((c) => {
    const cp    = filtered.filter((p) => p.clientId === c.id);
    const spend = cp.reduce((s, p) => s + p.totalAmount, 0);
    const ppl   = cp.reduce((s, p) => s + (p.peopleCount || 0), 0);
    return { ...c, spend, ppl, avg: ppl ? Math.round(spend / ppl) : 0 };
  }).filter((c) => cf === "ALL" || c.id === cf);

  const iu = {};
  filtered.forEach((p) => p.items.forEach((item) => {
    if (!iu[item.groceryId]) iu[item.groceryId] = { qty: 0, spend: 0 };
    iu[item.groceryId].qty   += item.qty;
    iu[item.groceryId].spend += item.total;
  }));
  const topItems = Object.entries(iu).map(([id, v]) => ({ ...getGrocery(id), ...v })).sort((a, b) => b.spend - a.spend).slice(0, 8);

  return (
    <div>
      <div className="ph"><div className="ptit">Reports</div><div className="psub">Analyse spending and consumption</div></div>
      <div className="pb">
        <div className="fr">
          <div className="fg">
            <label>Type</label>
            <select value={rt} onChange={(e) => setRt(e.target.value)}>
              <option value="monthly">Monthly Summary</option>
              <option value="daily">Daily Breakdown</option>
            </select>
          </div>
          <div className="fg">
            <label>Month</label>
            <select value={mf} onChange={(e) => setMf(e.target.value)}>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Client</label>
            <select value={cf} onChange={(e) => setCf(e.target.value)}>
              <option value="ALL">All Clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="sgrid mb24">
          {[
            { label: "Total Spend",    value: fmt(ttSpend),           color: "var(--accent)"  },
            { label: "People Served",  value: ttPpl.toLocaleString(), color: "var(--info)"    },
            { label: "Avg/Person",     value: fmt(avgPP),             color: "var(--accent3)" },
            { label: "Days Recorded",  value: days.length,            color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="scard" style={{ "--sc": s.color }}>
              <div className="sval">{s.value}</div><div className="slbl">{s.label}</div>
            </div>
          ))}
        </div>

        {rt === "monthly" && (
          <div className="g2">
            <div className="card">
              <div className="ctit">Client-wise Breakdown</div>
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead><tr><th>Client</th><th>Spend</th><th>People</th><th>Avg/Person</th></tr></thead>
                <tbody>
                  {cBreak.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td className="ta">{fmt(c.spend)}</td>
                      <td>{c.ppl.toLocaleString()}</td>
                      <td>{fmt(c.avg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="ctit">Top Items by Spend</div>
              {topItems.map((item) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div className="df jb aic" style={{ marginBottom: 5 }}>
                    <span className="ts">{item.name} ({item.qty.toFixed(1)} {item.unit})</span>
                    <span className="ta ts">{fmt(item.spend)}</span>
                  </div>
                  <div className="pb2"><div className="pf" style={{ width: topItems[0]?.spend ? `${(item.spend / topItems[0].spend) * 100}%` : "0%", background: "var(--info)" }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rt === "daily" && (
          <div className="card">
            <div className="ctit">Daily Report — {mf}</div>
            <div className="tw">
              <table>
                <thead><tr><th>Date</th><th>Client</th><th>Vendor</th><th>People</th><th>Amount</th><th>Avg/Person</th></tr></thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.date)}</td>
                      <td>{getClient(p.clientId)?.name}</td>
                      <td><span className="bdg bg">{p.addedBy}</span></td>
                      <td>{p.peopleCount || "—"}</td>
                      <td className="ta">{fmt(p.totalAmount)}</td>
                      <td>{p.peopleCount ? fmt(Math.round(p.totalAmount / p.peopleCount)) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════
function UsersPage() {
  return (
    <div>
      <div className="ph"><div className="ptit">User Management</div><div className="psub">Admin and vendor accounts</div></div>
      <div className="pb">
        <div className="card">
          <div className="tw">
            <table>
              <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Assigned Client</th></tr></thead>
              <tbody>
                {USERS.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="df aic g10">
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: u.role === "admin" ? "var(--info)" : "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, fontFamily: "Syne", flexShrink: 0 }}>{u.name[0]}</div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="tm">@{u.username}</td>
                    <td><span className={"bdg " + (u.role === "admin" ? "bb" : "bo")}>{u.role}</span></td>
                    <td>{u.clientId ? getClient(u.clientId)?.name : <span className="tm">All Clients</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD PURCHASE
// ══════════════════════════════════════════════════════════════════════════════
function AddPurchasePage({ currentUser, clients, groceryItems, onAdd }) {
  const [date,   setDate]   = useState(todayStr());
  const [cid,    setCid]    = useState(currentUser.clientId || clients[0]?.id || '');
  const [ppl,    setPpl]    = useState("");
  const [items,  setItems]  = useState([{ groceryId: "G1", qty: "", rate: "" }]);
  const [ok,     setOk]     = useState(false);

  const addItem    = ()        => setItems([...items, { groceryId: "G1", qty: "", rate: "" }]);
  const removeItem = (i)       => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, f, v) => { const c = [...items]; c[i] = { ...c[i], [f]: v }; setItems(c); };
  const total      = items.reduce((s, item) => s + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)), 0);

  const handleSubmit = () => {
    if (!date || items.some((i) => !i.qty || !i.rate)) { alert("Please fill all fields"); return; }
    onAdd({
      id: Date.now(), clientId: cid, date,
      peopleCount: parseInt(ppl) || 0,
      addedBy: currentUser.username,
      items: items.map((item) => ({ groceryId: item.groceryId, qty: parseFloat(item.qty), rate: parseFloat(item.rate), total: parseFloat(item.qty) * parseFloat(item.rate) })),
      totalAmount: total,
    });
    setOk(true); setItems([{ groceryId: "G1", qty: "", rate: "" }]); setPpl("");
    setTimeout(() => setOk(false), 3000);
  };

  return (
    <div>
      <div className="ph"><div className="ptit">Add Daily Entry</div><div className="psub">Record grocery purchases</div></div>
      <div className="pb">
        {ok && <div className="al als">Entry saved successfully!</div>}
        <div className="card mb20">
          <div className="ctit">Entry Details</div>
          <div className="g3">
            <div className="fg"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} /></div>
            <div className="fg">
              <label>Client</label>
              <select value={cid} onChange={(e) => setCid(e.target.value)} disabled={!!currentUser.clientId}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="fg"><label>People Served</label><input type="number" value={ppl} onChange={(e) => setPpl(e.target.value)} placeholder="e.g. 250" /></div>
          </div>
        </div>

        <div className="card mb20">
          <div className="ctit">Grocery Items</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 36px", gap: 10, fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            <span>Item</span><span>Qty</span><span>Rate</span><span></span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="pir">
              <select value={item.groceryId} onChange={(e) => updateItem(i, "groceryId", e.target.value)}>
                {groceryItems.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.unit})</option>)}
              </select>
              <input type="number" value={item.qty}  onChange={(e) => updateItem(i, "qty",  e.target.value)} placeholder="Qty"  />
              <input type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} placeholder="Rate" />
              <button className="btn btn-d btn-sm" onClick={() => removeItem(i)} disabled={items.length === 1}>x</button>
            </div>
          ))}
          <button className="btn btn-s btn-sm" style={{ marginTop: 8 }} onClick={addItem}>+ Add Item</button>
        </div>

        <div className="card">
          <div className="df jb aic">
            <div>
              <div className="ts tm">Total Amount</div>
              <div className="ta" style={{ fontSize: 28 }}>{fmt(total)}</div>
              {ppl && <div className="ts tm">approx {fmt(Math.round(total / parseInt(ppl)))} per person</div>}
            </div>
            <button className="btn btn-p" style={{ padding: "14px 32px" }} onClick={handleSubmit}>Save Entry</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VENDOR DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function VendorDashboard({ currentUser, purchases, clients }) {
  const myP      = purchases.filter((p) => p.addedBy === currentUser.username);
  const thisM    = getMonth(todayStr());
  const monthP   = myP.filter((p) => getMonth(p.date) === thisM);
  const ttM      = monthP.reduce((s, p) => s + p.totalAmount, 0);
  const ttPpl    = monthP.reduce((s, p) => s + (p.peopleCount || 0), 0);
  const client   = clients.find((c) => c.id === currentUser.clientId);
  const recent   = [...myP].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div>
      <div className="ph"><div className="ptit">My Dashboard</div><div className="psub">{client?.name} — {thisM}</div></div>
      <div className="pb">
        <div className="sgrid">
          {[
            { label: "Month Spend",       value: fmt(ttM),                color: "var(--accent)"  },
            { label: "People Served",     value: ttPpl.toLocaleString(),  color: "var(--info)"    },
            { label: "Avg / Person",      value: ttPpl ? fmt(Math.round(ttM / ttPpl)) : "N/A", color: "var(--accent3)" },
            { label: "Entries This Month",value: monthP.length,           color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="scard" style={{ "--sc": s.color }}>
              <div className="sval">{s.value}</div><div className="slbl">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="ctit">Recent Entries</div>
          {recent.length === 0 ? (
            <div className="emp"><div className="eic">-</div><div>No entries yet</div></div>
          ) : (
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr><th>Date</th><th>Items</th><th>People</th><th>Amount</th></tr></thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td>{p.items.length} items</td>
                    <td>{p.peopleCount || "—"}</td>
                    <td className="ta">{fmt(p.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function MyPurchasesPage({ currentUser, purchases }) {
  const myP = [...purchases.filter((p) => p.addedBy === currentUser.username)].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div>
      <div className="ph"><div className="ptit">My Entries</div><div className="psub">{myP.length} entries submitted</div></div>
      <div className="pb">
        <div className="card">
          <div className="tw">
            <table>
              <thead><tr><th>Date</th><th>Items</th><th>People</th><th>Amount</th></tr></thead>
              <tbody>
                {myP.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td>{p.items.length} items</td>
                    <td>{p.peopleCount || "—"}</td>
                    <td className="ta">{fmt(p.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SHARED: CONFIRM MODAL
// ══════════════════════════════════════════════════════════════════════════════
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="mo" onClick={onCancel}>
      <div className="mb" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="mbt" style={{ color: "var(--danger)" }}>Confirm Delete</div>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>{message}</p>
        <div className="mbf">
          <button className="btn btn-s" onClick={onCancel}>Cancel</button>
          <button className="btn btn-d" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAGE CLIENTS
// ══════════════════════════════════════════════════════════════════════════════
function ManageClientsPage({ clients, onAdd, onDelete, onEdit }) {
  const blank = { name: "", type: "Hospital", location: "" };
  const [form,    setForm]    = useState(blank);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [err,     setErr]     = useState("");

  const handleSave = async () => {
    if (!form.name.trim() || !form.location.trim()) { setErr("Name and location are required."); return; }
    try {
      if (editId) {
        await onEdit({ ...form, id: editId });
        setEditId(null);
      } else {
        await onAdd({ ...form });
      }
      setForm(blank); setErr("");
    } catch(e) { setErr(e.message); }
  };

  const startEdit = (c) => { setForm({ name: c.name, type: c.type, location: c.location }); setEditId(c.id); setErr(""); };
  const cancelEdit = ()  => { setForm(blank); setEditId(null); setErr(""); };

  return (
    <div>
      <div className="ph"><div className="ptit">Manage Clients</div><div className="psub">Add, edit or remove hospitals and hostels</div></div>
      <div className="pb">
        <div className="g2" style={{ alignItems: "start" }}>
          {/* Form */}
          <div className="card" style={{ borderColor: editId ? "rgba(0,230,118,0.3)" : "var(--border)" }}>
            <div className="ctit">{editId ? "Edit Client" : "Add New Client"}</div>
            {err && <div className="al ale">{err}</div>}
            <div className="fg"><label>Client Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. City Hospital" /></div>
            <div className="fg">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Hospital</option>
                <option>Hostel Mess</option>
                <option>School</option>
                <option>Corporate</option>
              </select>
            </div>
            <div className="fg"><label>Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Sector 12" /></div>
            <div className="df" style={{ gap: 10 }}>
              <button className="btn btn-p" onClick={handleSave}>{editId ? "Save Changes" : "Add Client"}</button>
              {editId && <button className="btn btn-s" onClick={cancelEdit}>Cancel</button>}
            </div>
          </div>

          {/* List */}
          <div className="card">
            <div className="ctit">All Clients ({clients.length})</div>
            {clients.length === 0 && <div className="emp" style={{ padding: 24 }}><div>No clients yet</div></div>}
            {clients.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div className="ts tm">{c.type} · {c.location}</div>
                </div>
                <div className="df" style={{ gap: 8 }}>
                  <button className="btn btn-s btn-sm" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn btn-d btn-sm" onClick={() => setConfirm(c.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {confirm && <ConfirmModal message="Delete this client? All related data will remain but won't link to this client." onConfirm={() => { onDelete(confirm); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAGE GROCERY ITEMS
// ══════════════════════════════════════════════════════════════════════════════
function ManageItemsPage({ groceryItems, onAdd, onDelete, onEdit }) {
  const blank = { name: "", unit: "kg", category: "Grains" };
  const [form,    setForm]    = useState(blank);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [err,     setErr]     = useState("");
  const units      = ["kg", "litre", "piece", "dozen", "box", "packet", "gram"];
  const categories = ["Grains", "Pulses", "Vegetables", "Oils", "Dairy", "Spices", "Fruits", "Meat", "Others"];

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("Item name is required."); return; }
    try {
      if (editId) {
        await onEdit({ ...form, id: editId });
        setEditId(null);
      } else {
        await onAdd({ ...form });
      }
      setForm(blank); setErr("");
    } catch(e) { setErr(e.message); }
  };

  const startEdit = (g) => { setForm({ name: g.name, unit: g.unit, category: g.category }); setEditId(g.id); setErr(""); };
  const cancelEdit = ()  => { setForm(blank); setEditId(null); setErr(""); };

  return (
    <div>
      <div className="ph"><div className="ptit">Manage Grocery Items</div><div className="psub">Add, edit or remove items from the inventory list</div></div>
      <div className="pb">
        <div className="g2" style={{ alignItems: "start" }}>
          {/* Form */}
          <div className="card" style={{ borderColor: editId ? "rgba(0,230,118,0.3)" : "var(--border)" }}>
            <div className="ctit">{editId ? "Edit Item" : "Add New Item"}</div>
            {err && <div className="al ale">{err}</div>}
            <div className="fg"><label>Item Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basmati Rice" /></div>
            <div className="fg">
              <label>Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {units.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="df" style={{ gap: 10 }}>
              <button className="btn btn-p" onClick={handleSave}>{editId ? "Save Changes" : "Add Item"}</button>
              {editId && <button className="btn btn-s" onClick={cancelEdit}>Cancel</button>}
            </div>
          </div>

          {/* List */}
          <div className="card">
            <div className="ctit">All Items ({groceryItems.length})</div>
            {groceryItems.length === 0 && <div className="emp" style={{ padding: 24 }}><div>No items yet</div></div>}
            {groceryItems.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</div>
                  <div className="ts tm"><span className="bdg bb" style={{ marginRight: 6 }}>{g.category}</span>{g.unit}</div>
                </div>
                <div className="df" style={{ gap: 8 }}>
                  <button className="btn btn-s btn-sm" onClick={() => startEdit(g)}>Edit</button>
                  <button className="btn btn-d btn-sm" onClick={() => setConfirm(g.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {confirm && <ConfirmModal message="Delete this grocery item? It will no longer appear in vendor entry forms." onConfirm={() => { onDelete(confirm); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAGE USERS
// ══════════════════════════════════════════════════════════════════════════════
function ManageUsersPage({ users, clients, onAdd, onDelete, onEdit }) {
  const blank = { name: "", username: "", password: "", role: "vendor", clientId: clients[0]?.id || "" };
  const [form,    setForm]    = useState(blank);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [err,     setErr]     = useState("");

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim() || (!editId && !form.password.trim())) { setErr("Name, username and password are required."); return; }
    try {
      if (editId) {
        await onEdit({ ...form, id: editId });
        setEditId(null);
      } else {
        await onAdd({ ...form });
      }
      setForm(blank); setErr("");
    } catch(e) { setErr(e.message); }
  };

  const startEdit = (u) => { setForm({ name: u.name, username: u.username, password: u.password, role: u.role, clientId: u.clientId || "" }); setEditId(u.id); setErr(""); };
  const cancelEdit = ()  => { setForm(blank); setEditId(null); setErr(""); };

  return (
    <div>
      <div className="ph"><div className="ptit">Manage Users</div><div className="psub">Add, edit or remove admin and vendor accounts</div></div>
      <div className="pb">
        <div className="g2" style={{ alignItems: "start" }}>
          {/* Form */}
          <div className="card" style={{ borderColor: editId ? "rgba(0,230,118,0.3)" : "var(--border)" }}>
            <div className="ctit">{editId ? "Edit User" : "Add New User"}</div>
            {err && <div className="al ale">{err}</div>}
            <div className="fg"><label>Full Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ravi Kumar" /></div>
            <div className="fg"><label>Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. vendor7" disabled={!!editId} /></div>
            <div className="fg"><label>Password</label><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" /></div>
            <div className="fg">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === "vendor" && (
              <div className="fg">
                <label>Assigned Client</label>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="df" style={{ gap: 10 }}>
              <button className="btn btn-p" onClick={handleSave}>{editId ? "Save Changes" : "Add User"}</button>
              {editId && <button className="btn btn-s" onClick={cancelEdit}>Cancel</button>}
            </div>
          </div>

          {/* List */}
          <div className="card">
            <div className="ctit">All Users ({users.length})</div>
            {users.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="df aic" style={{ gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: u.role === "admin" ? "var(--info)" : "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, fontFamily: "Syne", flexShrink: 0 }}>{u.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div className="ts tm">@{u.username} · <span className={"bdg " + (u.role === "admin" ? "bb" : "bo")}>{u.role}</span> {u.clientId ? "· " + (clients.find(c => c.id === u.clientId)?.name || "") : ""}</div>
                  </div>
                </div>
                <div className="df" style={{ gap: 8 }}>
                  <button className="btn btn-s btn-sm" onClick={() => startEdit(u)}>Edit</button>
                  <button className="btn btn-d btn-sm" onClick={() => setConfirm(u.id)} disabled={u.role === "admin" && users.filter(x => x.role === "admin").length === 1}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {confirm && <ConfirmModal message="Delete this user? They will no longer be able to log in." onConfirm={() => { onDelete(confirm); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAGE PURCHASE ENTRIES
// ══════════════════════════════════════════════════════════════════════════════
function ManagePurchasesPage({ purchases, clients, groceryItems, onDelete, onEdit }) {
  const [cf,      setCf]      = useState("ALL");
  const [mf,      setMf]      = useState(getMonth(todayStr()));
  const [confirm, setConfirm] = useState(null);
  const [editP,   setEditP]   = useState(null);

  const months   = [...new Set(purchases.map((p) => getMonth(p.date)))].sort().reverse();
  const filtered = purchases
    .filter((p) => (cf === "ALL" || p.clientId === cf) && (!mf || getMonth(p.date) === mf))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="ph"><div className="ptit">Manage Purchase Entries</div><div className="psub">Edit or delete existing daily purchase entries</div></div>
      <div className="pb">
        <div className="fr">
          <div className="fg">
            <label>Client</label>
            <select value={cf} onChange={(e) => setCf(e.target.value)}>
              <option value="ALL">All Clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Month</label>
            <select value={mf} onChange={(e) => setMf(e.target.value)}>
              <option value="">All Months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          <div className="ctit">{filtered.length} entries</div>
          {filtered.length === 0 && <div className="emp" style={{ padding: 24 }}><div>No entries found</div></div>}
          <div className="tw">
            <table>
              <thead><tr><th>Date</th><th>Client</th><th>Vendor</th><th>Items</th><th>People</th><th>Amount</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td style={{ fontWeight: 600 }}>{clients.find(c => c.id === p.clientId)?.name || p.clientId}</td>
                    <td><span className="bdg bg">{p.addedBy}</span></td>
                    <td>{p.items.length}</td>
                    <td>{p.peopleCount || "—"}</td>
                    <td className="ta">{fmt(p.totalAmount)}</td>
                    <td>
                      <div className="df" style={{ gap: 6 }}>
                        <button className="btn btn-s btn-sm" onClick={() => setEditP(JSON.parse(JSON.stringify(p)))}>Edit</button>
                        <button className="btn btn-d btn-sm" onClick={() => setConfirm(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirm && <ConfirmModal message="Delete this purchase entry permanently?" onConfirm={() => { onDelete(confirm); setConfirm(null); }} onCancel={() => setConfirm(null)} />}

      {editP && (
        <EditPurchaseModal
          purchase={editP}
          clients={clients}
          groceryItems={groceryItems}
          onSave={(updated) => { onEdit(updated); setEditP(null); }}
          onClose={() => setEditP(null)}
        />
      )}
    </div>
  );
}

function EditPurchaseModal({ purchase, clients, groceryItems, onSave, onClose }) {
  const [p, setP] = useState(purchase);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateItem = (i, field, val) => {
    const items = [...p.items];
    items[i] = { ...items[i], [field]: val };
    items[i].total = (parseFloat(items[i].qty) || 0) * (parseFloat(items[i].rate) || 0);
    setP({ ...p, items, totalAmount: items.reduce((s, it) => s + it.total, 0) });
  };
  const removeItem = (i) => {
    const items = p.items.filter((_, idx) => idx !== i);
    setP({ ...p, items, totalAmount: items.reduce((s, it) => s + it.total, 0) });
  };
  const addItem = () => {
    const items = [...p.items, { groceryId: groceryItems[0]?.id || "", qty: 0, rate: 0, total: 0 }];
    setP({ ...p, items });
  };

  const handleSave = async () => {
    if (!p.clientId || !p.date || p.items.length === 0) {
      setError("Please fill all fields and add at least one item");
      return;
    }
    setBusy(true);
    setError("");
    try {
      console.log("Saving purchase:", p);
      const result = await onSave(p);
      console.log("Save result:", result);
      setTimeout(() => onClose(), 500);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save changes");
      setBusy(false);
    }
  };

  return (
    <div className="mo" onClick={onClose}>
      <div className="mb" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="mbt">Edit Purchase Entry</div>
        {error && <div className="al ale" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="g2" style={{ marginBottom: 16 }}>
          <div className="fg">
            <label>Date</label>
            <input type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })} />
          </div>
          <div className="fg">
            <label>Client</label>
            <select value={p.clientId} onChange={(e) => setP({ ...p, clientId: e.target.value })}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="fg">
          <label>People Served</label>
          <input type="number" value={p.peopleCount} onChange={(e) => setP({ ...p, peopleCount: parseInt(e.target.value) || 0 })} />
        </div>

        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Items</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 32px", gap: 8, marginBottom: 8, fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Item</span><span>Qty</span><span>Rate</span><span></span>
        </div>
        {p.items.map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 32px", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <select value={item.groceryId} onChange={(e) => updateItem(i, "groceryId", e.target.value)}>
              {groceryItems.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.unit})</option>)}
            </select>
            <input type="number" value={item.qty}  onChange={(e) => updateItem(i, "qty",  e.target.value)} style={{ padding: "8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "Epilogue", fontSize: 13 }} />
            <input type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} style={{ padding: "8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "Epilogue", fontSize: 13 }} />
            <button className="btn btn-d btn-sm" style={{ padding: "6px 8px" }} onClick={() => removeItem(i)} disabled={p.items.length === 1}>x</button>
          </div>
        ))}
        <button className="btn btn-s btn-sm" onClick={addItem} style={{ marginBottom: 16 }}>+ Add Item</button>

        <hr className="div" />
        <div className="df jb aic">
          <span className="tm">Total: <strong className="ta">{fmt(p.totalAmount)}</strong></span>
          <div className="df" style={{ gap: 10 }}>
            <button className="btn btn-s" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-p" onClick={handleSave} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD RETURN ENTRY PAGE
// ══════════════════════════════════════════════════════════════════════════════
function AddReturnPage({ currentUser, clients, groceryItems, onAdd }) {
  const [r, setR] = useState({
    clientId: clients[0]?.id || "",
    date: todayStr(),
    items: [{ groceryId: groceryItems[0]?.id || "", qty: 0, rate: 0, total: 0 }],
    totalAmount: 0,
  });
  const [busy, setBusy] = useState(false);

  const updateItem = (i, field, val) => {
    const items = [...r.items];
    items[i] = { ...items[i], [field]: val };
    items[i].total = (parseFloat(items[i].qty) || 0) * (parseFloat(items[i].rate) || 0);
    setR({ ...r, items, totalAmount: items.reduce((s, it) => s + it.total, 0) });
  };
  const removeItem = (i) => {
    const items = r.items.filter((_, idx) => idx !== i);
    setR({ ...r, items, totalAmount: items.reduce((s, it) => s + it.total, 0) });
  };
  const addItem = () => {
    const items = [...r.items, { groceryId: groceryItems[0]?.id || "", qty: 0, rate: 0, total: 0 }];
    setR({ ...r, items });
  };
  const handleAdd = async () => {
    if (!r.clientId || !r.date || r.items.length === 0) { alert("Please fill all fields"); return; }
    setBusy(true);
    try {
      await onAdd(r);
      setR({
        clientId: clients[0]?.id || "",
        date: todayStr(),
        items: [{ groceryId: groceryItems[0]?.id || "", qty: 0, rate: 0, total: 0 }],
        totalAmount: 0,
      });
      alert("Return entry added!");
    } catch (err) {
      alert("Error: " + err.message);
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="ph"><div className="ptit">Add Return Entry</div><div className="psub">Record items returned from client</div></div>
      <div className="pb">
        <div className="card">
          <div className="g2" style={{ marginBottom: 16 }}>
            <div className="fg">
              <label>Date</label>
              <input type="date" value={r.date} onChange={(e) => setR({ ...r, date: e.target.value })} />
            </div>
            <div className="fg">
              <label>Client</label>
              <select value={r.clientId} onChange={(e) => setR({ ...r, clientId: e.target.value })}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Items Returned</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 32px", gap: 8, marginBottom: 8, fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            <span>Item</span><span>Qty</span><span>Rate</span><span></span>
          </div>
          {r.items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 32px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select value={item.groceryId} onChange={(e) => updateItem(i, "groceryId", e.target.value)}>
                {groceryItems.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.unit})</option>)}
              </select>
              <input type="number" value={item.qty}  onChange={(e) => updateItem(i, "qty",  e.target.value)} style={{ padding: "8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "Epilogue", fontSize: 13 }} />
              <input type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} style={{ padding: "8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "Epilogue", fontSize: 13 }} />
              <button className="btn btn-d btn-sm" style={{ padding: "6px 8px" }} onClick={() => removeItem(i)} disabled={r.items.length === 1}>x</button>
            </div>
          ))}
          <button className="btn btn-s btn-sm" onClick={addItem} style={{ marginBottom: 16 }}>+ Add Item</button>

          <hr className="div" />
          <div className="df jb aic">
            <span className="tm">Total Return: <strong className="ta">{fmt(r.totalAmount)}</strong></span>
            <button className="btn btn-p" onClick={handleAdd} disabled={busy}>{busy ? "Adding..." : "Add Return Entry"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MY RETURNS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function MyReturnsPage({ currentUser, returns }) {
  const myReturns = returns.filter((r) => r.addedBy === currentUser.username).sort((a, b) => b.date.localeCompare(a.date));
  const totalReturned = myReturns.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div>
      <div className="ph"><div className="ptit">My Return Entries</div><div className="psub">Items returned from clients</div></div>
      <div className="pb">
        <div className="sgrid mb24">
          <div className="scard" style={{ "--sc": "var(--accent)" }}>
            <div className="sval">{myReturns.length}</div>
            <div className="slbl">Total Returns</div>
          </div>
          <div className="scard" style={{ "--sc": "var(--info)" }}>
            <div className="sval">{fmt(totalReturned)}</div>
            <div className="slbl">Total Amount Returned</div>
          </div>
        </div>
        {myReturns.length === 0 ? (
          <div className="card emp"><div className="eic">📋</div>No returns yet</div>
        ) : (
          <div className="card">
            <div className="tw">
              <table>
                <thead><tr><th>Date</th><th>Client</th><th>Items</th><th>Amount</th></tr></thead>
                <tbody>
                  {myReturns.map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.date)}</td>
                      <td>{r.clientId}</td>
                      <td>{r.items.length} items</td>
                      <td className="ta">{fmt(r.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAGE RETURNS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ManageReturnsPage({ returns, clients, onDelete }) {
  const [editR, setEditR] = useState(null);
  const getClient = (id) => clients.find(c => c.id === id);
  const sorted = [...returns].sort((a, b) => b.date.localeCompare(a.date));
  const totalReturned = returns.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div>
      <div className="ph"><div className="ptit">All Return Entries</div><div className="psub">Manage all returns</div></div>
      <div className="pb">
        <div className="sgrid mb24">
          <div className="scard" style={{ "--sc": "var(--accent)" }}>
            <div className="sval">{sorted.length}</div>
            <div className="slbl">Total Returns</div>
          </div>
          <div className="scard" style={{ "--sc": "var(--info)" }}>
            <div className="sval">{fmt(totalReturned)}</div>
            <div className="slbl">Total Returned</div>
          </div>
        </div>
        {sorted.length === 0 ? (
          <div className="card emp"><div className="eic">📋</div>No returns yet</div>
        ) : (
          <div className="card">
            <div className="tw">
              <table>
                <thead><tr><th>Date</th><th>Client</th><th>Vendor</th><th>Items</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.date)}</td>
                      <td>{getClient(r.clientId)?.name}</td>
                      <td><span className="bdg bg">{r.addedBy}</span></td>
                      <td>{r.items.length}</td>
                      <td className="ta">{fmt(r.totalAmount)}</td>
                      <td style={{ textAlign: "right" }}><button className="btn btn-d btn-sm" onClick={() => onDelete(r.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [activePage,   setActivePage]   = useState(null);
  const [purchases,    setPurchases]    = useState([]);
  const [returns,      setReturns]      = useState([]);
  const [clients,      setClients]      = useState([]);
  const getClient = (id) => clients.find(c => c.id === id);
  const [groceryItems, setGroceryItems] = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [globalError,  setGlobalError]  = useState("");

  // ── Load all data from API after login ────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, items, purs, rets] = await Promise.all([
        api("/clients"),
        api("/items"),
        api("/purchases"),
        api("/returns"),
      ]);
      setClients(cls);
      setGroceryItems(items);
      setPurchases(purs);
      setReturns(rets);
      // Load users only for admin
      const stored = localStorage.getItem("cf_user");
      if (stored && JSON.parse(stored).role === "admin") {
        const usrs = await api("/users");
        setUsers(usrs);
      }
    } catch (err) {
      setGlobalError("Could not load data from server: " + err.message);
    }
    setLoading(false);
  }, []);

  // ── Login / Logout ────────────────────────────────────────
  const handleLogin = async (user, token) => {
    localStorage.setItem("cf_token", token);
    localStorage.setItem("cf_user",  JSON.stringify(user));
    setCurrentUser(user);
    setActivePage(user.role === "admin" ? "dashboard" : "vendor-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_user");
    setCurrentUser(null);
    setActivePage(null);
    setPurchases([]); setClients([]); setGroceryItems([]); setUsers([]); setReturns([]);
  };

  // Restore session on page refresh
  useEffect(() => {
    const token = localStorage.getItem("cf_token");
    const user  = localStorage.getItem("cf_user");
    if (token && user) {
      const u = JSON.parse(user);
      setCurrentUser(u);
      setActivePage(u.role === "admin" ? "dashboard" : "vendor-dashboard");
    }
  }, []);

  // Load data when user is set
  useEffect(() => {
    if (currentUser) loadAllData();
  }, [currentUser, loadAllData]);

  // ── Purchase CRUD ─────────────────────────────────────────
  const addPurchase = async (p) => {
    const saved = await api("/purchases", { method: "POST", body: JSON.stringify(p) });
    setPurchases((prev) => [saved, ...prev]);
    return saved;
  };
  const deletePurchase = async (id) => {
    await api("/purchases/" + id, { method: "DELETE" });
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  };
  const editPurchase = async (p) => {
    try {
      const updated = await api("/purchases/" + p.id, { method: "PUT", body: JSON.stringify(p) });
      setPurchases((prev) => prev.map((x) => x.id === p.id ? updated : x));
      return updated;
    } catch (err) {
      console.error("Edit error:", err);
      throw err;
    }
  };

  // ── Client CRUD ───────────────────────────────────────────
  const addClient = async (c) => {
    const saved = await api("/clients", { method: "POST", body: JSON.stringify(c) });
    setClients((prev) => [...prev, saved]);
    return saved;
  };
  const deleteClient = async (id) => {
    await api("/clients/" + id, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
  };
  const editClient = async (c) => {
    const updated = await api("/clients/" + c.id, { method: "PUT", body: JSON.stringify(c) });
    setClients((prev) => prev.map((x) => x.id === c.id ? updated : x));
  };

  // ── Grocery Items CRUD ────────────────────────────────────
  const addItem = async (g) => {
    const saved = await api("/items", { method: "POST", body: JSON.stringify(g) });
    setGroceryItems((prev) => [...prev, saved]);
    return saved;
  };
  const deleteItem = async (id) => {
    await api("/items/" + id, { method: "DELETE" });
    setGroceryItems((prev) => prev.filter((g) => g.id !== id));
  };
  const editItem = async (g) => {
    const updated = await api("/items/" + g.id, { method: "PUT", body: JSON.stringify(g) });
    setGroceryItems((prev) => prev.map((x) => x.id === g.id ? updated : x));
  };

  // ── Users CRUD ────────────────────────────────────────────
  const addUser = async (u) => {
    const saved = await api("/users", { method: "POST", body: JSON.stringify(u) });
    setUsers((prev) => [...prev, saved]);
    return saved;
  };
  const deleteUser = async (id) => {
    await api("/users/" + id, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };
  const editUser = async (u) => {
    const updated = await api("/users/" + u.id, { method: "PUT", body: JSON.stringify(u) });
    setUsers((prev) => prev.map((x) => x.id === u.id ? updated : x));
  };

  // ── Returns CRUD ───────────────────────────────────────────
  const addReturn = async (r) => {
    const saved = await api("/returns", { method: "POST", body: JSON.stringify(r) });
    setReturns((prev) => [saved, ...prev]);
    return saved;
  };
  const deleteReturn = async (id) => {
    await api("/returns/" + id, { method: "DELETE" });
    setReturns((prev) => prev.filter((r) => r.id !== id));
  };

  const renderPage = () => {
    if (loading) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--muted)", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ fontFamily: "Syne", fontWeight: 700 }}>Loading data from server...</div>
      </div>
    );

    if (currentUser.role === "admin") {
      switch (activePage) {
        case "dashboard": return <AdminDashboard purchases={purchases} clients={clients} />;
        case "clients":   return <ClientsPage    purchases={purchases} clients={clients} users={users} />;
        case "inventory": return <InventoryPage  purchases={purchases} clients={clients} groceryItems={groceryItems} />;
        case "purchases": return <PurchasesPage  purchases={purchases} clients={clients} groceryItems={groceryItems} />;
        case "reports":   return <ReportsPage    purchases={purchases} clients={clients} groceryItems={groceryItems} />;
        case "manage-clients":   return <ManageClientsPage clients={clients} onAdd={addClient} onDelete={deleteClient} onEdit={editClient} />;
        case "manage-items":     return <ManageItemsPage   groceryItems={groceryItems} onAdd={addItem} onDelete={deleteItem} onEdit={editItem} />;
        case "manage-users":     return <ManageUsersPage   users={users} clients={clients} onAdd={addUser} onDelete={deleteUser} onEdit={editUser} />;
        case "manage-purchases": return <ManagePurchasesPage purchases={purchases} clients={clients} groceryItems={groceryItems} onDelete={deletePurchase} onEdit={editPurchase} />;
        case "manage-returns":   return <ManageReturnsPage returns={returns} clients={clients} onDelete={deleteReturn} />;
        default:          return <AdminDashboard purchases={purchases} clients={clients} />;
      }
    } else {
      switch (activePage) {
        case "vendor-dashboard": return <VendorDashboard  currentUser={currentUser} purchases={purchases} clients={clients} />;
        case "add-purchase":     return <AddPurchasePage  currentUser={currentUser} clients={clients} groceryItems={groceryItems} onAdd={addPurchase} />;
        case "my-purchases":     return <MyPurchasesPage  currentUser={currentUser} purchases={purchases} />;
        case "manage-my-purchases": return <ManagePurchasesPage purchases={purchases.filter(p => p.addedBy === currentUser.username)} clients={clients} groceryItems={groceryItems} onDelete={deletePurchase} onEdit={editPurchase} />;
        case "add-return":       return <AddReturnPage    currentUser={currentUser} clients={clients} groceryItems={groceryItems} onAdd={addReturn} />;
        case "my-returns":       return <MyReturnsPage    currentUser={currentUser} returns={returns} />;
        default:                 return <VendorDashboard  currentUser={currentUser} purchases={purchases} clients={clients} />;
      }
    }
  };

  return (
    <>
      <style>{CSS}</style>
      {!currentUser ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="app-layout">
          <Sidebar currentUser={currentUser} activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} />
          <div className="main-content">
            {globalError && (
              <div style={{ margin: "20px 32px 0", padding: "12px 16px", background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: 8, color: "var(--danger)", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>⚠ {globalError}</span>
                <button onClick={() => { setGlobalError(""); loadAllData(); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 12 }}>Retry</button>
              </div>
            )}
            {renderPage()}
          </div>
        </div>
      )}
    </>
  );
}
