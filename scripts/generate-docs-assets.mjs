import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('docs/assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. HERO BANNER
const heroBanner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.45" />
    </filter>
  </defs>

  <rect width="1200" height="420" fill="url(#bgGrad)" />

  <!-- Grid overlay -->
  <g opacity="0.07" stroke="#94a3b8" stroke-width="1">
    <path d="M0,60 H1200 M0,120 H1200 M0,180 H1200 M0,240 H1200 M0,300 H1200 M0,360 H1200" />
    <path d="M100,0 V420 M200,0 V420 M300,0 V420 M400,0 V420 M500,0 V420 M600,0 V420 M700,0 V420 M800,0 V420 M900,0 V420 M1000,0 V420 M1100,0 V420" />
  </g>

  <!-- Ambient Glows -->
  <circle cx="150" cy="80" r="140" fill="url(#accentGlow)" filter="url(#glow)" />
  <circle cx="1080" cy="340" r="180" fill="#047857" opacity="0.2" filter="url(#glow)" />
  <circle cx="950" cy="80" r="100" fill="#2563eb" opacity="0.15" filter="url(#glow)" />

  <rect x="0" y="0" width="1200" height="4" fill="url(#primaryGrad)" />

  <!-- Left Content -->
  <g transform="translate(80, 55)">
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="56" height="56" rx="14" fill="#0f172a" stroke="#10b981" stroke-width="2" filter="url(#shadow)" />
      <path d="M28 14 L44 22 L28 30 L12 22 Z" fill="#10b981" />
      <path d="M18 25.5 V35 C18 38 23 41 28 41 C33 41 38 38 38 35 V25.5" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" />
      <path d="M41 23.5 V33" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="41" cy="34.5" r="2" fill="#f59e0b" />

      <text x="72" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" fill="#ffffff" letter-spacing="-0.03em">
        Edu<tspan fill="#10b981">OS</tspan>
      </text>
      <rect x="225" y="16" width="96" height="26" rx="13" fill="#064e3b" stroke="#10b981" stroke-width="1" />
      <text x="273" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#a7f3d0" text-anchor="middle">v1.0.0 MVP</text>

      <rect x="330" y="16" width="115" height="26" rx="13" fill="#1e1b4b" stroke="#6366f1" stroke-width="1" />
      <text x="387" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#c7d2fe" text-anchor="middle">PRODUCTION</text>
    </g>

    <text x="0" y="105" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#f8fafc" letter-spacing="-0.02em">
      The Next-Gen Bilingual School Management SaaS
    </text>

    <text x="0" y="142" font-family="'SolaimanLipi', 'Noto Sans Bengali', system-ui, sans-serif" font-size="20" font-weight="600" fill="#94a3b8">
      বাংলাদেশের বিদ্যালয়, কলেজ ও মাদ্রাসার জন্য পূর্ণাঙ্গ ডিজিটাল শিক্ষা প্রশাসন প্ল্যাটফর্ম
    </text>

    <text x="0" y="176" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b" font-weight="500">
      Built for Bangladesh Education Boards • NCTB GPA 5.0 Continuous Assessment • bKash/Nagad MFS • 17-digit BRN
    </text>

    <!-- Badges Row -->
    <g transform="translate(0, 212)">
      <g transform="translate(0, 0)">
        <rect width="138" height="42" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.2" />
        <circle cx="22" cy="21" r="10" fill="#065f46" />
        <path d="M18 21 L21 24 L26 18" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" />
        <text x="38" y="26" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">21 Modules</text>
      </g>

      <g transform="translate(150, 0)">
        <rect width="170" height="42" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.2" />
        <circle cx="22" cy="21" r="10" fill="#1e3a8a" />
        <text x="22" y="25" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#93c5fd" text-anchor="middle">অ/A</text>
        <text x="40" y="26" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">English &amp; বাংলা</text>
      </g>

      <g transform="translate(332, 0)">
        <rect width="168" height="42" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.2" />
        <circle cx="22" cy="21" r="10" fill="#064e3b" />
        <path d="M17 21 L21 25 L27 17" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
        <text x="38" y="26" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">311 Tests Passed</text>
      </g>

      <g transform="translate(512, 0)">
        <rect width="144" height="42" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.2" />
        <circle cx="22" cy="21" r="10" fill="#4c1d95" />
        <path d="M22 15 V23 M22 26 V27" stroke="#c084fc" stroke-width="2" stroke-linecap="round" />
        <text x="38" y="26" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">Zero Lint Err</text>
      </g>
    </g>

    <g transform="translate(0, 276)">
      <text x="0" y="14" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#64748b" letter-spacing="0.05em">ENGINEERING STACK:</text>
      <text x="145" y="14" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#94a3b8">
        React 19 • TypeScript • Vite 8 • Tailwind CSS v4 • Supabase • PostgreSQL RLS • Vitest
      </text>
    </g>
  </g>

  <!-- Right Dashboard Card Preview -->
  <g transform="translate(770, 48)">
    <rect x="0" y="0" width="370" height="315" rx="16" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" filter="url(#shadow)" />
    <rect x="0" y="0" width="370" height="42" rx="16" fill="#1e293b" />
    <circle cx="24" cy="21" r="5" fill="#ef4444" />
    <circle cx="40" cy="21" r="5" fill="#f59e0b" />
    <circle cx="56" cy="21" r="5" fill="#10b981" />
    <rect x="80" y="12" width="180" height="18" rx="6" fill="#0f172a" />
    <text x="170" y="25" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">app.eduos.bd/dashboard</text>
    <rect x="305" y="11" width="46" height="20" rx="4" fill="#065f46" />
    <text x="328" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#6ee7b7" text-anchor="middle">ONLINE</text>

    <g transform="translate(18, 56)">
      <rect width="334" height="52" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
      <rect x="10" y="10" width="32" height="32" rx="8" fill="#10b981" opacity="0.2" />
      <text x="26" y="31" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#10b981" text-anchor="middle">🏫</text>
      <text x="52" y="25" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Dhaka Ideal Collegiate School</text>
      <text x="52" y="39" font-family="monospace" font-size="10" fill="#64748b">EIIN: 108421 • Dhaka Board • Day Shift</text>
    </g>

    <g transform="translate(18, 120)">
      <rect width="160" height="64" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
      <text x="14" y="22" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#64748b">TOTAL ENROLLED</text>
      <text x="14" y="46" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="#ffffff">1,482</text>
      <rect x="94" y="30" width="54" height="18" rx="4" fill="#064e3b" />
      <text x="121" y="42" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#34d399" text-anchor="middle">+98.2%</text>

      <g transform="translate(174, 0)">
        <rect width="160" height="64" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
        <text x="14" y="22" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#64748b">MFS TUITION FEES</text>
        <text x="14" y="46" font-family="system-ui, sans-serif" font-size="19" font-weight="800" fill="#10b981">৳ 18.4L</text>
        <rect x="106" y="30" width="42" height="18" rx="4" fill="#831843" />
        <text x="127" y="42" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f472b6" text-anchor="middle">bKash</text>
      </g>
    </g>

    <g transform="translate(18, 196)">
      <rect width="334" height="48" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
      <text x="14" y="20" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94a3b8">DAILY ATTENDANCE RATE (BIO / RFID)</text>
      <text x="320" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#34d399" text-anchor="end">94.8%</text>
      <rect x="14" y="29" width="306" height="7" rx="3.5" fill="#1e293b" />
      <rect x="14" y="29" width="290" height="7" rx="3.5" fill="url(#primaryGrad)" />
    </g>

    <g transform="translate(18, 256)">
      <rect width="105" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" />
      <text x="52" y="22" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="middle">📄 Admit Cards</text>

      <rect x="115" y="0" width="105" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" />
      <text x="167" y="22" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="middle">📊 Broadsheet</text>

      <rect x="229" y="0" width="105" height="34" rx="8" fill="#065f46" stroke="#10b981" stroke-width="1" />
      <text x="281" y="22" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#a7f3d0" text-anchor="middle">⚡ Parent App</text>
    </g>
  </g>
</svg>`;

// 2. ARCHITECTURE DIAGRAM
const architectureDiagram = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 680" width="100%" height="100%">
  <defs>
    <linearGradient id="archBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#041f1a" />
    </linearGradient>
    <linearGradient id="layerGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="1100" height="680" rx="16" fill="url(#archBg)" stroke="#1e293b" stroke-width="2" />

  <!-- Header -->
  <g transform="translate(50, 40)">
    <rect x="0" y="0" width="40" height="40" rx="10" fill="#065f46" />
    <text x="20" y="26" font-family="system-ui, sans-serif" font-size="20" fill="#34d399" text-anchor="middle">🏛️</text>
    <text x="56" y="22" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#f8fafc">EduOS Multi-Tenant Architecture</text>
    <text x="56" y="38" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Bilingual SaaS Architecture, Security Isolation, and Distributed Service Layers</text>
  </g>

  <!-- TIER 1: Presentation & Clients -->
  <g transform="translate(50, 100)">
    <rect width="1000" height="100" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" filter="url(#boxShadow)" />
    <rect x="0" y="0" width="160" height="28" rx="6" fill="#1e293b" />
    <text x="12" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#38bdf8">1. PRESENTATION TIER</text>

    <!-- Client Cards -->
    <g transform="translate(20, 36)">
      <rect width="220" height="50" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" />
      <text x="14" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">🏫 Admin &amp; Staff Web</text>
      <text x="14" y="40" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Institutional Control Center</text>

      <g transform="translate(245, 0)">
        <rect width="220" height="50" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" />
        <text x="14" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">👨‍👩‍👧 Parent &amp; Student Portal</text>
        <text x="14" y="40" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Multi-child switcher &amp; fees</text>
      </g>

      <g transform="translate(490, 0)">
        <rect width="220" height="50" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" />
        <text x="14" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">📝 Public Admission Portal</text>
        <text x="14" y="40" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">17-digit BRN self-service</text>
      </g>

      <g transform="translate(735, 0)">
        <rect width="225" height="50" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" />
        <text x="14" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f1f5f9">📱 Responsive Mobile / PWA</text>
        <text x="14" y="40" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Offline sync banner &amp; cache</text>
      </g>
    </g>
  </g>

  <!-- Connectors -->
  <path d="M550 200 V230" stroke="#10b981" stroke-width="2" stroke-dasharray="4" />

  <!-- TIER 2: Application Framework & Client State -->
  <g transform="translate(50, 230)">
    <rect width="1000" height="110" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="1.5" filter="url(#boxShadow)" />
    <rect x="0" y="0" width="220" height="28" rx="6" fill="#064e3b" />
    <text x="12" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#a7f3d0">2. APPLICATION CORE &amp; I18N</text>

    <g transform="translate(20, 38)">
      <rect width="180" height="56" rx="8" fill="#1e293b" stroke="#334155" />
      <text x="14" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">React 19 &amp; Vite 8</text>
      <text x="14" y="44" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Component Tree &amp; Router 7</text>

      <g transform="translate(195, 0)">
        <rect width="180" height="56" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="14" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Bilingual Engine</text>
        <text x="14" y="44" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">i18next (English &amp; বাংলা)</text>
      </g>

      <g transform="translate(390, 0)">
        <rect width="180" height="56" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="14" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Tailwind CSS v4</text>
        <text x="14" y="44" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Design tokens &amp; Dark mode</text>
      </g>

      <g transform="translate(585, 0)">
        <rect width="180" height="56" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="14" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">TanStack Query</text>
        <text x="14" y="44" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Optimistic Cache &amp; Revalidate</text>
      </g>

      <g transform="translate(780, 0)">
        <rect width="180" height="56" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="14" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Vector PDF Engine</text>
        <text x="14" y="44" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">CR80, A4 &amp; A3 Broadsheet</text>
      </g>
    </g>
  </g>

  <!-- Connectors -->
  <path d="M550 340 V370" stroke="#06b6d4" stroke-width="2" stroke-dasharray="4" />

  <!-- TIER 3: Security & Multi-Tenancy Layer -->
  <g transform="translate(50, 370)">
    <rect width="1000" height="100" rx="12" fill="#0f172a" stroke="#06b6d4" stroke-width="1.5" filter="url(#boxShadow)" />
    <rect x="0" y="0" width="260" height="28" rx="6" fill="#0e7490" />
    <text x="12" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#cffafe">3. TENANT ISOLATION &amp; SECURITY</text>

    <g transform="translate(20, 36)">
      <rect width="305" height="50" rx="8" fill="#1e293b" stroke="#334155" />
      <text x="14" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">PostgreSQL Row-Level Security (RLS)</text>
      <text x="14" y="39" font-family="monospace" font-size="10" fill="#38bdf8">USING (school_id = auth_school_id())</text>

      <g transform="translate(325, 0)">
        <rect width="310" height="50" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="14" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Role-Based Access Control (RBAC)</text>
        <text x="14" y="39" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">SuperAdmin • Principal • Teacher • Accountant • Parent</text>
      </g>

      <g transform="translate(655, 0)">
        <rect width="305" height="50" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="14" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Append-Only Audit Logging</text>
        <text x="14" y="39" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Immutable log on grades, fees &amp; attendance</text>
      </g>
    </g>
  </g>

  <!-- Connectors -->
  <path d="M550 470 V500" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4" />

  <!-- TIER 4: Database & External Gateways -->
  <g transform="translate(50, 500)">
    <rect width="1000" height="135" rx="12" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5" filter="url(#boxShadow)" />
    <rect x="0" y="0" width="280" height="28" rx="6" fill="#1d4ed8" />
    <text x="12" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#dbeafe">4. PERSISTENCE &amp; EXTERNAL SERVICES</text>

    <g transform="translate(20, 36)">
      <!-- Database Partition -->
      <rect width="470" height="85" rx="8" fill="#1e293b" stroke="#334155" />
      <text x="14" y="22" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#60a5fa">🐘 Supabase Managed PostgreSQL</text>
      <text x="14" y="40" font-family="monospace" font-size="10" fill="#cbd5e1">23 Migrations • Foreign Key Cascades • Realtime Replication</text>
      <text x="14" y="56" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Students • Attendance • Timetables • Exams • Fees • Payroll • Hostels • Library</text>
      <text x="14" y="72" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Quizzes • Leave Quotas • Circulars • Transfer Certificates</text>

      <!-- External Integrations Partition -->
      <g transform="translate(490, 0)">
        <rect width="470" height="85" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="14" y="22" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#f43f5e">🔌 Bangladesh Ecosystem Integrations</text>
        <text x="14" y="42" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#fb7185">bKash &amp; Nagad MFS:</text>
        <text x="150" y="42" font-family="system-ui, sans-serif" font-size="10" fill="#cbd5e1">TrxID validation &amp; automated ledger settlement</text>
        <text x="14" y="60" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#38bdf8">SMS Broadcast Gateway:</text>
        <text x="165" y="60" font-family="system-ui, sans-serif" font-size="10" fill="#cbd5e1">Bangladeshi sender ID, attendance alerts &amp; notices</text>
        <text x="14" y="76" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#a7f3d0">Storage Buckets:</text>
        <text x="120" y="76" font-family="system-ui, sans-serif" font-size="10" fill="#cbd5e1">Private S3 bucket for student photos &amp; homework files</text>
      </g>
    </g>
  </g>
</svg>`;

// 3. ACADEMIC LIFECYCLE
const academicLifecycle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 360" width="100%" height="100%">
  <defs>
    <linearGradient id="flowBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="flowStepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>

  <rect width="1100" height="360" rx="16" fill="url(#flowBg)" stroke="#1e293b" stroke-width="2" />

  <!-- Header -->
  <g transform="translate(40, 32)">
    <text x="0" y="20" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#ffffff">Complete Institutional Academic Lifecycle in EduOS</text>
    <text x="0" y="38" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">From public candidate admission to continuous NCTB assessment, examination broadsheets, and graduation certificates</text>
  </g>

  <!-- Row 1: 4 steps -->
  <g transform="translate(40, 95)">
    <!-- Step 1 -->
    <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <circle cx="28" cy="28" r="14" fill="#065f46" />
    <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#34d399" text-anchor="middle">1</text>
    <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Online Admission</text>
    <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">17-digit BRN validation</text>
    <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Self-service candidate slip PDF</text>

    <!-- Arrow 1->2 -->
    <path d="M280 47 H300" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
    <path d="M295 42 L302 47 L295 52" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" />

    <!-- Step 2 -->
    <g transform="translate(265, 0)">
      <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <circle cx="28" cy="28" r="14" fill="#065f46" />
      <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#34d399" text-anchor="middle">2</text>
      <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Enrollment &amp; ID Card</text>
      <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Roll allocation &amp; section sync</text>
      <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">CR80 PVC ID Card with QR</text>
    </g>

    <!-- Arrow 2->3 -->
    <path d="M545 47 H565" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
    <path d="M560 42 L567 47 L560 52" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" />

    <!-- Step 3 -->
    <g transform="translate(530, 0)">
      <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <circle cx="28" cy="28" r="14" fill="#065f46" />
      <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#34d399" text-anchor="middle">3</text>
      <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Routine &amp; Attendance</text>
      <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Clash-free timetable periods</text>
      <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">RFID/Biometric &amp; SMS alerts</text>
    </g>

    <!-- Arrow 3->4 -->
    <path d="M810 47 H830" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
    <path d="M825 42 L832 47 L825 52" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" />

    <!-- Step 4 -->
    <g transform="translate(795, 0)">
      <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <circle cx="28" cy="28" r="14" fill="#065f46" />
      <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#34d399" text-anchor="middle">4</text>
      <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Homework &amp; MFS Fees</text>
      <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Subject tasks &amp; submissions</text>
      <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">bKash/Nagad fee clearance</text>
    </g>
  </g>

  <!-- Flow connector from row 1 to row 2 -->
  <path d="M912 195 V225 H157 V240" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="4" />

  <!-- Row 2: 4 steps -->
  <g transform="translate(40, 235)">
    <!-- Step 5 -->
    <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <circle cx="28" cy="28" r="14" fill="#0e7490" />
    <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#67e8f9" text-anchor="middle">5</text>
    <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">CA Assessments &amp; Quizzes</text>
    <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Continuous Assessment (20%)</text>
    <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Timed online MCQ tests</text>

    <!-- Arrow 5->6 -->
    <path d="M280 47 H300" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />
    <path d="M295 42 L302 47 L295 52" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />

    <!-- Step 6 -->
    <g transform="translate(265, 0)">
      <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <circle cx="28" cy="28" r="14" fill="#0e7490" />
      <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#67e8f9" text-anchor="middle">6</text>
      <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Admit Cards &amp; Seating</text>
      <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Fee dues blocker verification</text>
      <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Zigzag anti-cheating seat plan</text>
    </g>

    <!-- Arrow 6->7 -->
    <path d="M545 47 H565" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />
    <path d="M560 42 L567 47 L560 52" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />

    <!-- Step 7 -->
    <g transform="translate(530, 0)">
      <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
      <circle cx="28" cy="28" r="14" fill="#0e7490" />
      <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#67e8f9" text-anchor="middle">7</text>
      <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Tabulation Broadsheet</text>
      <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">CA 20% + Final 80% marks</text>
      <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">NCTB GPA 5.0 A3 Broadsheet</text>
    </g>

    <!-- Arrow 7->8 -->
    <path d="M810 47 H830" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />
    <path d="M825 42 L832 47 L825 52" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />

    <!-- Step 8 -->
    <g transform="translate(795, 0)">
      <rect width="235" height="95" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="2" />
      <circle cx="28" cy="28" r="14" fill="#065f46" />
      <text x="28" y="33" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#34d399" text-anchor="middle">8</text>
      <text x="52" y="33" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">Report Cards &amp; TC</text>
      <text x="16" y="58" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Progress cards with badges</text>
      <text x="16" y="74" font-family="system-ui, sans-serif" font-size="11" fill="#34d399">Transfer Certificate (TC) PDF</text>
    </g>
  </g>
</svg>`;

// 4. DASHBOARD MOCKUP
const dashboardMockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 580" width="100%" height="100%">
  <defs>
    <linearGradient id="dbBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#021f19" />
    </linearGradient>
    <linearGradient id="kpiGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.3" />
    </filter>
  </defs>

  <rect width="1000" height="580" rx="14" fill="url(#dbBg)" stroke="#334155" stroke-width="2" />

  <!-- Top App Window Bar -->
  <rect width="1000" height="46" rx="14" fill="#1e293b" />
  <circle cx="24" cy="23" r="5" fill="#ef4444" />
  <circle cx="40" cy="23" r="5" fill="#f59e0b" />
  <circle cx="56" cy="23" r="5" fill="#10b981" />

  <!-- Topbar Search & Switcher -->
  <rect x="180" y="10" width="360" height="26" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <text x="196" y="27" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">🔍 Search students, roll, fees, exams... (Ctrl + K)</text>

  <!-- Language Switcher Pill -->
  <g transform="translate(810, 10)">
    <rect width="90" height="26" rx="6" fill="#0f172a" stroke="#334155" />
    <rect x="2" y="2" width="42" height="22" rx="4" fill="#065f46" />
    <text x="23" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#a7f3d0" text-anchor="middle">বাংলা</text>
    <text x="66" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94a3b8" text-anchor="middle">EN</text>
  </g>

  <!-- User Avatar -->
  <circle cx="940" cy="23" r="13" fill="#047857" />
  <text x="940" y="27" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">HM</text>

  <!-- Left Sidebar -->
  <g transform="translate(0, 46)">
    <rect width="180" height="534" fill="#090e1a" stroke="#1e293b" stroke-width="1" />
    
    <!-- Logo in Sidebar -->
    <text x="20" y="36" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#ffffff">
      Edu<tspan fill="#10b981">OS</tspan>
    </text>

    <!-- Nav Items -->
    <g transform="translate(12, 60)">
      <!-- Active Item -->
      <rect width="156" height="34" rx="6" fill="#064e3b" />
      <text x="14" y="22" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#34d399">📊 ড্যাশবোর্ড (Dashboard)</text>

      <g transform="translate(0, 42)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">👨‍🎓 শিক্ষার্থীরা (Students)</text>
      </g>
      <g transform="translate(0, 78)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">📅 হাজিরা (Attendance)</text>
      </g>
      <g transform="translate(0, 114)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">💳 বেতন ও ফি (Fees)</text>
      </g>
      <g transform="translate(0, 150)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">📝 পরীক্ষা ও ফলাফল (Exams)</text>
      </g>
      <g transform="translate(0, 186)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">🗂️ ব্রডশিট (Broadsheet)</text>
      </g>
      <g transform="translate(0, 222)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">🎫 প্রবেশপত্র (Admit Cards)</text>
      </g>
      <g transform="translate(0, 258)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">💰 বেতন বিল (Payroll)</text>
      </g>
      <g transform="translate(0, 294)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">📢 নোটিশ বোর্ড (Notices)</text>
      </g>
      <g transform="translate(0, 330)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">👨‍👩‍👧 অভিভাবক পোর্টাল (Portal)</text>
      </g>
      <g transform="translate(0, 366)">
        <text x="14" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8">🎯 অনলাইন কুইজ (Quiz)</text>
      </g>
    </g>
  </g>

  <!-- Main Dashboard Canvas Area -->
  <g transform="translate(200, 62)">
    <!-- Institution Banner -->
    <rect width="780" height="54" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="20" y="25" font-family="system-ui, sans-serif" font-size="15" font-weight="800" fill="#f8fafc">মতিঝিল মডেল স্কুল অ্যান্ড কলেজ (EIIN: 108421)</text>
    <text x="20" y="42" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">ঢাকা শিক্ষা বোর্ড • প্রাতঃ ও দিবা শাখা • বর্তমান শিক্ষাবর্ষ: ২০২৬</text>

    <rect x="660" y="12" width="105" height="30" rx="6" fill="#065f46" />
    <text x="712" y="31" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#a7f3d0" text-anchor="middle">⚡ লাইভ সেশন</text>

    <!-- 4 KPI Cards -->
    <g transform="translate(0, 68)">
      <!-- KPI 1 -->
      <rect width="186" height="88" rx="8" fill="#0f172a" stroke="#334155" filter="url(#cardShadow)" />
      <text x="14" y="26" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">মোট শিক্ষার্থী (Students)</text>
      <text x="14" y="56" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#ffffff">১,৪৮২</text>
      <text x="14" y="74" font-family="system-ui, sans-serif" font-size="10" fill="#34d399">↑ ৯৮% সক্রিয় শিক্ষার্থী</text>

      <!-- KPI 2 -->
      <g transform="translate(198, 0)">
        <rect width="186" height="88" rx="8" fill="#0f172a" stroke="#334155" filter="url(#cardShadow)" />
        <text x="14" y="26" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">আজকের উপস্থিতি (Attendance)</text>
        <text x="14" y="56" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#34d399">৯৪.৮%</text>
        <text x="14" y="74" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">বায়োমেট্রিক ও আরএফআইডি</text>
      </g>

      <!-- KPI 3 -->
      <g transform="translate(396, 0)">
        <rect width="186" height="88" rx="8" fill="#0f172a" stroke="#334155" filter="url(#cardShadow)" />
        <text x="14" y="26" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">চলতি মাসের ফি (bKash/Nagad)</text>
        <text x="14" y="56" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#10b981">৳ ৮,৪২,০০০</text>
        <text x="14" y="74" font-family="system-ui, sans-serif" font-size="10" fill="#38bdf8">৮২% আদায় সম্পন্ন</text>
      </g>

      <!-- KPI 4 -->
      <g transform="translate(594, 0)">
        <rect width="186" height="88" rx="8" fill="#0f172a" stroke="#334155" filter="url(#cardShadow)" />
        <text x="14" y="26" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">মডেল টেস্ট ও কুইজ (Quizzes)</text>
        <text x="14" y="56" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#38bdf8">৪ টি</text>
        <text x="14" y="74" font-family="system-ui, sans-serif" font-size="10" fill="#a855f7">নেগেটিভ মার্কিং সক্রিয়</text>
      </g>
    </g>

    <!-- Lower Split: Table + Routine Summary -->
    <g transform="translate(0, 172)">
      <!-- Left Table: Recent Transactions / Defaulters -->
      <rect width="480" height="315" rx="8" fill="#0f172a" stroke="#334155" filter="url(#cardShadow)" />
      <text x="18" y="28" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">সর্বশেষ ফি পরিশোধ লেজার (MFS Transactions)</text>

      <!-- Table Header -->
      <g transform="translate(18, 44)">
        <rect width="444" height="26" fill="#1e293b" rx="4" />
        <text x="12" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">শিক্ষার্থী ও রোল</text>
        <text x="150" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">শ্রেণি</text>
        <text x="240" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">পরিমাণ</text>
        <text x="340" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">মাধ্যম &amp; স্ট্যাটাস</text>
      </g>

      <!-- Row 1 -->
      <g transform="translate(18, 76)">
        <text x="12" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#f1f5f9">তানভীর আহমেদ (রোল ০১)</text>
        <text x="150" y="18" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">১০ম শ্রেণি - বিজ্ঞান</text>
        <text x="240" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#34d399">৳ ৩,৫০০</text>
        <rect x="340" y="4" width="46" height="18" rx="4" fill="#831843" />
        <text x="363" y="16" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f472b6" text-anchor="middle">bKash</text>
        <rect x="392" y="4" width="46" height="18" rx="4" fill="#064e3b" />
        <text x="415" y="16" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#34d399" text-anchor="middle">পরিশোধ</text>
      </g>

      <!-- Row 2 -->
      <g transform="translate(18, 114)">
        <text x="12" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#f1f5f9">সাদিয়া জাহান (রোল ০৪)</text>
        <text x="150" y="18" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">৯ম শ্রেণি - মানবিক</text>
        <text x="240" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#34d399">৳ ২,৮০০</text>
        <rect x="340" y="4" width="46" height="18" rx="4" fill="#7c2d12" />
        <text x="363" y="16" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#fdba74" text-anchor="middle">Nagad</text>
        <rect x="392" y="4" width="46" height="18" rx="4" fill="#064e3b" />
        <text x="415" y="16" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#34d399" text-anchor="middle">পরিশোধ</text>
      </g>

      <!-- Row 3 -->
      <g transform="translate(18, 152)">
        <text x="12" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#f1f5f9">আরিফুর রহমান (রোল ১৫)</text>
        <text x="150" y="18" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">৮ম শ্রেণি - শাখা ক</text>
        <text x="240" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#34d399">৳ ২,২০০</text>
        <rect x="340" y="4" width="46" height="18" rx="4" fill="#831843" />
        <text x="363" y="16" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f472b6" text-anchor="middle">bKash</text>
        <rect x="392" y="4" width="46" height="18" rx="4" fill="#064e3b" />
        <text x="415" y="16" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#34d399" text-anchor="middle">পরিশোধ</text>
      </g>

      <!-- Right Panel: Quick PDF Generation & Action Center -->
      <g transform="translate(498, 0)">
        <rect width="282" height="315" rx="8" fill="#0f172a" stroke="#334155" filter="url(#cardShadow)" />
        <text x="18" y="28" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc">১-ক্লিক ভেক্টর পিডিএফ এক্সপোর্ট</text>

        <g transform="translate(18, 48)">
          <rect width="246" height="52" rx="6" fill="#1e293b" stroke="#334155" />
          <text x="14" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#f1f5f9">📄 প্রবেশপত্র (Admit Cards)</text>
          <text x="14" y="40" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">স্বয়ংক্রিয় বকেয়া ফিল্টার ও কিউআর কোড</text>
        </g>

        <g transform="translate(18, 108)">
          <rect width="246" height="52" rx="6" fill="#1e293b" stroke="#334155" />
          <text x="14" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#f1f5f9">📊 ট্যাবুলেশন শিট (A3 Broadsheet)</text>
          <text x="14" y="40" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">ধারাবাহিক মূল্যায়ন (২০%) + ফাইনাল (৮০%)</text>
        </g>

        <g transform="translate(18, 168)">
          <rect width="246" height="52" rx="6" fill="#1e293b" stroke="#334155" />
          <text x="14" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#f1f5f9">🪪 শিক্ষার্থী আইডি কার্ড (CR80 PVC)</text>
          <text x="14" y="40" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">ফ্রন্ট ও ব্যাক প্রিন্ট প্রিভিউ ও কিউআর</text>
        </g>

        <g transform="translate(18, 228)">
          <rect width="246" height="52" rx="6" fill="#065f46" stroke="#10b981" />
          <text x="14" y="23" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff">📜 প্রশংসা ও ছাড়পত্র (TC &amp; Certs)</text>
          <text x="14" y="40" font-family="system-ui, sans-serif" font-size="10" fill="#a7f3d0">অ্যান্টি-টেম্পার যাচাইকরণ কোডসহ</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;

// 5. PARENT PORTAL MOCKUP
const parentPortalMockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="100%" height="100%">
  <defs>
    <linearGradient id="portalBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <rect width="960" height="540" rx="14" fill="url(#portalBg)" stroke="#334155" stroke-width="2" />

  <!-- App Bar -->
  <rect width="960" height="50" rx="14" fill="#1e293b" />
  <circle cx="24" cy="25" r="5" fill="#ef4444" />
  <circle cx="40" cy="25" r="5" fill="#f59e0b" />
  <circle cx="56" cy="25" r="5" fill="#10b981" />

  <text x="80" y="32" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff">
    Edu<tspan fill="#10b981">OS</tspan>
    <tspan font-weight="500" font-size="12" fill="#94a3b8"> | Dedicated Parent &amp; Student Portal</tspan>
  </text>

  <!-- Multi-Child Switcher Tabs -->
  <g transform="translate(620, 10)">
    <rect width="150" height="30" rx="6" fill="#065f46" stroke="#10b981" stroke-width="1" />
    <text x="75" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">👦 তানভীর (১০ম শ্রেণি)</text>

    <g transform="translate(160, 0)">
      <rect width="150" height="30" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1" />
      <text x="75" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="middle">👧 সাদিয়া (৭ম শ্রেণি)</text>
    </g>
  </g>

  <!-- Content Body -->
  <g transform="translate(40, 70)">
    <!-- Student Profile Card Banner -->
    <rect width="880" height="70" rx="10" fill="#1e293b" stroke="#334155" />
    <circle cx="45" cy="35" r="22" fill="#10b981" opacity="0.2" />
    <text x="45" y="42" font-family="system-ui, sans-serif" font-size="20" text-anchor="middle">🎓</text>
    <text x="85" y="30" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#ffffff">তানভীর আহমেদ (Tanvir Ahmed)</text>
    <text x="85" y="48" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">রোল: ০১ • শ্রেণি: ১০ম (বিজ্ঞান) • শাখা: মেঘনা • শিক্ষাবর্ষ: ২০২৬</text>

    <rect x="700" y="18" width="160" height="34" rx="6" fill="#064e3b" stroke="#34d399" stroke-width="1" />
    <text x="780" y="39" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#a7f3d0" text-anchor="middle">📄 প্রগ্রেস ডসিয়ার PDF</text>
  </g>

  <!-- 3 Performance Cards -->
  <g transform="translate(40, 160)">
    <!-- Collegiate Standing -->
    <rect width="280" height="110" rx="10" fill="#0f172a" stroke="#334155" />
    <text x="16" y="28" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94a3b8">উপস্থিতি ও কলেজিয়েট স্ট্যাটাস</text>
    <text x="16" y="66" font-family="system-ui, sans-serif" font-size="30" font-weight="900" fill="#34d399">৯১.২%</text>
    <rect x="150" y="44" width="114" height="26" rx="6" fill="#064e3b" />
    <text x="207" y="61" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#6ee7b7" text-anchor="middle">কলেজিয়েট (Collegiate)</text>
    <text x="16" y="94" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">অনুমোদিত ছুটি: ৩ দিন • অনুপস্থিত: ১ দিন</text>

    <!-- Tuition Fees & Direct bKash Pay -->
    <g transform="translate(300, 0)">
      <rect width="280" height="110" rx="10" fill="#0f172a" stroke="#334155" />
      <text x="16" y="28" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94a3b8">বকেয়া টিউশন ফি (Unpaid Dues)</text>
      <text x="16" y="66" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#f43f5e">৳ ১,৮৫০</text>
      <rect x="150" y="44" width="114" height="28" rx="6" fill="#e11d48" />
      <text x="207" y="62" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">⚡ bKash Pay</text>
      <text x="16" y="94" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">মার্চ ২০২৬ সেশন ফি ও ল্যাব চার্জ</text>
    </g>

    <!-- GPA 5.0 Continuous Assessment -->
    <g transform="translate(600, 0)">
      <rect width="280" height="110" rx="10" fill="#0f172a" stroke="#334155" />
      <text x="16" y="28" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94a3b8">সর্বশেষ টার্ম মূল্যায়ন (NCTB)</text>
      <text x="16" y="66" font-family="system-ui, sans-serif" font-size="30" font-weight="900" fill="#38bdf8">GPA 5.00</text>
      <rect x="180" y="44" width="84" height="26" rx="6" fill="#1e3a8a" />
      <text x="222" y="61" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#bfdbfe" text-anchor="middle">Grade A+</text>
      <text x="16" y="94" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">মেধাক্রম: ১ম (বিজ্ঞান বিভাগ)</text>
    </g>
  </g>

  <!-- Homework & Quizzes Row -->
  <g transform="translate(40, 290)">
    <rect width="880" height="210" rx="10" fill="#0f172a" stroke="#334155" />
    <text x="20" y="28" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#f8fafc">আজকের ক্লাসের বাড়ির কাজ ও অনলাইন টেস্ট (Active Tasks)</text>

    <!-- Task 1 -->
    <g transform="translate(20, 46)">
      <rect width="840" height="42" rx="6" fill="#1e293b" />
      <text x="16" y="26" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">পদার্থবিজ্ঞান (Physics): অধ্যায় ৪ — কাজ, ক্ষমতা ও শক্তি অনুশীলনীর গাণিতিক সমস্যা</text>
      <rect x="710" y="8" width="115" height="26" rx="4" fill="#065f46" />
      <text x="767" y="25" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#a7f3d0" text-anchor="middle">জমা দিন (Submit)</text>
    </g>

    <!-- Task 2 -->
    <g transform="translate(20, 96)">
      <rect width="840" height="42" rx="6" fill="#1e293b" />
      <text x="16" y="26" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">উচ্চতর গণিত (Higher Math): উপপাদ্য ১২ এর প্রমাণ খাতায় লিখে ছবি আপলোড করুন</text>
      <rect x="710" y="8" width="115" height="26" rx="4" fill="#065f46" />
      <text x="767" y="25" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#a7f3d0" text-anchor="middle">জমা দিন (Submit)</text>
    </g>

    <!-- Task 3 (Quiz) -->
    <g transform="translate(20, 146)">
      <rect width="840" height="42" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1" />
      <text x="16" y="26" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#c7d2fe">🎯 সাধারণ বিজ্ঞান এমসিকিউ মডেল টেস্ট ২০২৬ — ২০ টি প্রশ্ন • সময়: ২৫ মিনিট</text>
      <rect x="710" y="8" width="115" height="26" rx="4" fill="#4f46e5" />
      <text x="767" y="25" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">টেস্ট শুরু করুন</text>
    </g>
  </g>
</svg>`;

// 6. VECTOR PDF SHOWCASE
const vectorPdfMockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="100%" height="100%">
  <defs>
    <linearGradient id="pdfBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#041f1a" />
    </linearGradient>
    <filter id="docShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.5" />
    </filter>
  </defs>

  <rect width="1000" height="500" rx="14" fill="url(#pdfBg)" stroke="#334155" stroke-width="2" />

  <!-- Header -->
  <g transform="translate(40, 32)">
    <text x="0" y="22" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#ffffff">Official Vector PDF Generation Engine</text>
    <text x="0" y="40" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">Standardized documents rendered client-side or server-side with anti-tamper QR tokens and institutional seals</text>
  </g>

  <!-- 4 Document Types Grid -->
  <g transform="translate(40, 85)">
    <!-- Doc 1: Student ID Card (CR80 PVC) -->
    <g transform="translate(0, 0)">
      <rect width="210" height="340" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="1.5" filter="url(#docShadow)" />
      <!-- Mini ID Card Simulation -->
      <rect x="20" y="24" width="170" height="230" rx="8" fill="#ffffff" />
      <rect x="20" y="24" width="170" height="42" rx="8" fill="#065f46" />
      <text x="105" y="42" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">DHAKA MODEL SCHOOL</text>
      <text x="105" y="54" font-family="monospace" font-size="7" fill="#a7f3d0" text-anchor="middle">EIIN: 108421</text>
      
      <!-- Student Photo Placeholder -->
      <rect x="70" y="76" width="70" height="70" rx="35" fill="#e2e8f0" stroke="#cbd5e1" />
      <circle cx="105" cy="104" r="18" fill="#94a3b8" />
      <path d="M85 136 C85 124 125 124 125 136 Z" fill="#94a3b8" />

      <text x="105" y="162" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">TANVIR AHMED</text>
      <text x="105" y="176" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle">Class: 10 • Roll: 01</text>

      <!-- Mini QR code -->
      <rect x="85" y="194" width="40" height="40" fill="#0f172a" />
      <rect x="89" y="198" width="12" height="12" fill="#ffffff" />
      <rect x="109" y="198" width="12" height="12" fill="#ffffff" />
      <rect x="89" y="218" width="12" height="12" fill="#ffffff" />

      <text x="105" y="290" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc" text-anchor="middle">Student ID Card</text>
      <text x="105" y="310" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">CR80 PVC (Front + Back)</text>
    </g>

    <!-- Doc 2: Admit Card with QR -->
    <g transform="translate(235, 0)">
      <rect width="210" height="340" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" filter="url(#docShadow)" />
      <!-- Mini Admit Card -->
      <rect x="20" y="24" width="170" height="230" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="25" y="28" width="160" height="24" fill="#1e293b" />
      <text x="105" y="44" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#ffffff" text-anchor="middle">EXAM ADMIT CARD</text>
      
      <text x="35" y="68" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#0f172a">Annual Examination 2026</text>
      <text x="35" y="82" font-family="system-ui, sans-serif" font-size="7" fill="#64748b">Roll: 01 • Class: 10 (Sci)</text>

      <!-- Fee Cleared Seal -->
      <rect x="35" y="94" width="70" height="16" rx="3" fill="#dcfce7" stroke="#10b981" />
      <text x="70" y="105" font-family="system-ui, sans-serif" font-size="7" font-weight="800" fill="#15803d" text-anchor="middle">✓ FEE CLEARED</text>

      <!-- Routine schedule preview lines -->
      <line x1="35" y1="124" x2="175" y2="124" stroke="#cbd5e1" />
      <line x1="35" y1="140" x2="175" y2="140" stroke="#cbd5e1" />
      <line x1="35" y1="156" x2="175" y2="156" stroke="#cbd5e1" />
      <line x1="35" y1="172" x2="175" y2="172" stroke="#cbd5e1" />

      <!-- Hall Seat: 304 -->
      <rect x="35" y="190" width="140" height="24" rx="4" fill="#f1f5f9" />
      <text x="105" y="206" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#0f172a" text-anchor="middle">Exam Hall: Room 304 (Seat A-12)</text>

      <text x="105" y="290" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc" text-anchor="middle">Admit Card</text>
      <text x="105" y="310" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Anti-cheating seat &amp; dues filter</text>
    </g>

    <!-- Doc 3: Tabulation Broadsheet (A3) -->
    <g transform="translate(470, 0)">
      <rect width="245" height="340" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5" filter="url(#docShadow)" />
      <!-- Mini Landscape Broadsheet -->
      <rect x="18" y="44" width="210" height="190" rx="4" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="22" y="48" width="202" height="20" fill="#0f172a" />
      <text x="123" y="62" font-family="system-ui, sans-serif" font-size="7" font-weight="800" fill="#ffffff" text-anchor="middle">CLASS TABULATION BROADSHEET (CA 20% + 80%)</text>
      
      <!-- Grid Simulation -->
      <g stroke="#cbd5e1" stroke-width="0.8">
        <line x1="22" y1="80" x2="224" y2="80" />
        <line x1="22" y1="96" x2="224" y2="96" />
        <line x1="22" y1="112" x2="224" y2="112" />
        <line x1="22" y1="128" x2="224" y2="128" />
        <line x1="22" y1="144" x2="224" y2="144" />
        <line x1="22" y1="160" x2="224" y2="160" />
        <line x1="22" y1="176" x2="224" y2="176" />
        
        <line x1="65" y1="68" x2="65" y2="225" />
        <line x1="105" y1="68" x2="105" y2="225" />
        <line x1="145" y1="68" x2="145" y2="225" />
        <line x1="185" y1="68" x2="185" y2="225" />
      </g>

      <text x="123" y="290" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc" text-anchor="middle">A3 Broadsheet Matrix</text>
      <text x="123" y="310" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">NCTB Continuous Assessment</text>
    </g>

    <!-- Doc 4: Transfer Certificate -->
    <g transform="translate(730, 0)">
      <rect width="230" height="340" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="1.5" filter="url(#docShadow)" />
      <!-- Mini TC with ornate border -->
      <rect x="20" y="24" width="190" height="230" rx="6" fill="#fefce8" stroke="#ca8a04" stroke-width="2" />
      
      <!-- Ornate Header -->
      <text x="115" y="48" font-family="Georgia, serif" font-size="9" font-weight="800" fill="#713f12" text-anchor="middle">DHAKA MODEL COLLEGE</text>
      <text x="115" y="60" font-family="system-ui, sans-serif" font-size="7" font-weight="700" fill="#854d0e" text-anchor="middle">TRANSFER CERTIFICATE (ছাড়পত্র)</text>

      <!-- Certificate Text Simulation -->
      <line x1="35" y1="80" x2="195" y2="80" stroke="#fef08a" stroke-width="3" />
      <line x1="35" y1="96" x2="195" y2="96" stroke="#fef08a" stroke-width="3" />
      <line x1="35" y1="112" x2="195" y2="112" stroke="#fef08a" stroke-width="3" />
      <line x1="35" y1="128" x2="195" y2="128" stroke="#fef08a" stroke-width="3" />
      
      <!-- Seal & Sign -->
      <circle cx="65" cy="180" r="18" fill="#fef08a" stroke="#ca8a04" />
      <text x="65" y="184" font-family="system-ui, sans-serif" font-size="7" font-weight="800" fill="#854d0e" text-anchor="middle">SEAL</text>

      <line x1="130" y1="190" x2="190" y2="190" stroke="#713f12" />
      <text x="160" y="202" font-family="system-ui, sans-serif" font-size="7" font-weight="600" fill="#713f12" text-anchor="middle">Headmaster</text>

      <!-- Anti-tamper verification token -->
      <rect x="35" y="222" width="160" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1" />
      <text x="115" y="234" font-family="monospace" font-size="7" fill="#64748b" text-anchor="middle">Token: TC-2026-9814-VERIFIED</text>

      <text x="115" y="290" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#f8fafc" text-anchor="middle">Transfer Certificate (TC)</text>
      <text x="115" y="310" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Anti-tamper verification token</text>
    </g>
  </g>
</svg>`;

// Write all files
fs.writeFileSync(path.join(outDir, 'eduos-hero-banner.svg'), heroBanner);
fs.writeFileSync(path.join(outDir, 'architecture-diagram.svg'), architectureDiagram);
fs.writeFileSync(path.join(outDir, 'academic-lifecycle.svg'), academicLifecycle);
fs.writeFileSync(path.join(outDir, 'dashboard-mockup.svg'), dashboardMockup);
fs.writeFileSync(path.join(outDir, 'parent-portal-mockup.svg'), parentPortalMockup);
fs.writeFileSync(path.join(outDir, 'vector-pdf-mockup.svg'), vectorPdfMockup);

console.log('Successfully generated all 6 vector SVG showcase assets in docs/assets/');
