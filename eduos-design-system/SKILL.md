# EduOS Design System — Skill

Use this skill when designing for **EduOS**, a teacher-first School Management OS (students, attendance, fees, results, exams, parent comms).

## Aesthetic
- **Google Classroom + Stripe Dashboard hybrid.** Clean, calm, white surfaces, one indigo accent, soft shadows, no gradients, no emoji in product chrome.
- Cards on a light gray page background. Tables are full-width inside cards.
- Sidebar nav (240px expanded / 72px collapsed) + 60px topbar.

## Tokens
Drop `colors_and_type.css` into the page. All values are CSS custom properties prefixed `--eduos-*` plus semantic aliases:
- `--eduos-primary` `#2F6FED` and `--eduos-primary-tint` `#EAF1FE`
- 9-step neutral ramp (`--eduos-neutral-0…900`)
- Semantic: `--eduos-success #16A34A`, `--eduos-warning #D97706`, `--eduos-danger #DC2626`, `--eduos-info #0284C7`
- Type: **Inter** 400/500/600. Scale: `display 28/36`, `h2 20/28`, `h3 16/24`, `body 14/20`, `small 13/18`, `micro 11/14 caps`.
- Radii: `xs 4 · sm 8 · md 12 · lg 16 · full`. Cards = 12. Modals = 16. Inputs/buttons = 8.
- Shadows: only `--shadow-sm` (cards at rest) and `--shadow-md` (popovers/modals). No glow, no colored shadows.

## Voice / copy
- Sentence case everywhere. No exclamations in confirms / toasts.
- Address the teacher as **you**. Refer to features by name (“Attendance”, not “we”).
- Numbers use tabular-nums in tables. Currency: `₹4,500`. Dates in tables: `25 May 2026`. Never `MM/DD/YY`.
- **No emoji.** Status = colored dot + label. Color always pairs with a glyph or word.
- Examples:
  - ✅ `Attendance saved.` ❌ `Hooray! 🎉 Saved successfully!`
  - ✅ `Pending fees · 12 students` ❌ `Yikes — 12 unpaid!`

## Component library (UI kit)
See `ui_kits/teacher-dashboard/components.jsx` and `kit.css`. Available primitives, all on `window`:

| Component | Notes |
|---|---|
| `<Button variant="primary\|secondary\|ghost\|danger" size="sm\|md\|lg" icon="lucide-name">` | Heights 28/36/44. |
| `<Badge tone="success\|warning\|danger\|info\|neutral">` | Pill with leading dot. |
| `<Avatar name="…" />` | Initials, hashed color. |
| `<Card title sub actions>` | Default surface. |
| `<KPI icon label value delta deltaTone footer>` | Dashboard tile. |
| `<Segmented options value onChange>` | Tabs / filters. |
| `<Toggle on onChange>` | iOS-style switch. |
| `<Sparkline values>` `<BarChart data>` `<Donut segments centerValue>` | SVG charts — no library. |
| `<Modal open onClose title footer>` | 16-radius modal with scrim. |
| `<Empty icon title sub action>` | Empty-state pattern. |
| `<Icon name="…" size=18 />` | Lucide via CDN. Default stroke 1.6, 20px in nav, 16px inline. |

CSS-only patterns (in `kit.css`): `.toolbar`, `.table-wrap`, `table.tbl`, `.field`, `.input`, `.select`, `.textarea`, `.radio-card`, `.av-row`, `.nav-item`, `.kpi`, `.page-head`.

## Iconography
**Lucide** via `https://unpkg.com/lucide@latest`. 1.5–1.8px stroke. 20px in nav, 16px in cells/buttons, 24px for empty-state heroes. Color inherits `currentColor` — set on the parent, not the icon.

## Layout primitives
- **App grid:** `grid-template-columns: 240px 1fr` (collapses to 72px). Sidebar `position: sticky; height: 100vh`.
- **Page:** `padding: 24px 32px 48px`, no max-width — content breathes to viewport.
- **KPI row:** `grid-3` or `grid-4` with `gap: 16`.
- **Charts + side panel:** `grid-template-columns: 2fr 1fr; gap: 16`.

## Don'ts
- No gradients, no neon/colored shadows, no full-bleed background imagery.
- No emoji in product chrome.
- No title-case buttons (`Add Student` ❌ → `Add student` ✅).
- No transform-scale on hover. Hover changes background tint only.
- No `outline: none` without a replacement focus ring (use the 3px indigo ring from `--shadow-focus`).

## When you need a new icon
Pick a Lucide name from [lucide.dev](https://lucide.dev). If none fits, draw a single-color SVG at 24×24, 1.5px stroke, round caps + joins — and add it to `assets/icons/`. Do **not** mix icon styles.

## Pages in the UI kit
Single clickable artifact at `ui_kits/teacher-dashboard/index.html`. Navigate via the sidebar (state in URL hash):
`#dashboard · #students · #attendance · #fees · #results · #exams_ai · #parent · #settings`

Re-use the existing pages as composition references; do not invent parallel patterns.
