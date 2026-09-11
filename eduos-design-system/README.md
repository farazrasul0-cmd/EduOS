# EduOS Design System

**Product:** School Management OS — a teacher-first SaaS for managing students, attendance, fees, results, exams, and parent communication.
**Audience:** Teachers (primary), school admins, parents.
**Vibe:** Google Classroom + Stripe Dashboard hybrid — calm, clean, and confidence-inspiring. Lots of white space, a single deep-blue accent, and zero ornamental noise.

## Sources

This design system was created from a product specification (no Figma link, codebase, or existing brand was attached). Every visual choice below is documented so future revisions can stay consistent.

- Spec: see project brief in chat (Teacher SaaS Dashboard UI — Full System Design).
- Reference inspiration named by stakeholder: **Google Classroom** (clarity), **Stripe Dashboard** (data density + restraint), **Notion** (modular cards).
- No existing logo, fonts, or color tokens were provided — everything in this system is original to EduOS and should be reviewed before being treated as canonical.

## At a glance

- **Primary:** Indigo / Deep Blue `#2F6FED`
- **Type:** Inter (Google Fonts) — 400 / 500 / 600 / 700
- **Radius:** `8px` (controls, inputs), `12px` (cards), `16px` (modals)
- **Shadow vocabulary:** two flavors only — `sm` (cards at rest), `md` (popovers, modals). No glow, no neon.
- **Iconography:** [Lucide](https://lucide.dev) via CDN — 1.5px stroke, 20px default.

---

## Content Fundamentals

EduOS speaks like a calm, competent colleague — not a marketing site, not a wizard, not a friend trying too hard. It is a working tool for working teachers.

### Voice
- **Person:** Address the teacher directly as **you**. EduOS refers to itself by feature name (“Attendance”, “Results”) rather than “we” or “EduOS thinks…”. Never first-person AI voice.
- **Tense:** Present, active. *Mark present.* *Save attendance.* *Publish results.*
- **Tone:** Plainspoken, mildly warm. Not chirpy. Not corporate. Think “a senior teacher walking you through the workflow”.

### Casing
- **Sentence case** for everything: buttons, menu items, table headers, modal titles. (`Add student`, not `Add Student` or `ADD STUDENT`.)
- **Title Case** is reserved for proper nouns and the product name (“School Management OS”, “Parent Portal”).
- **All-caps** is allowed *only* for tiny eyebrow labels above sections (tracking `0.04em`, 11px) — used sparingly.

### Copy patterns
| Situation | Pattern | Example |
|---|---|---|
| Primary button | Verb + object | `Add student`, `Save attendance`, `Publish results` |
| Empty state | One line, then one action | `No students yet.` + `[Add your first student]` |
| Success toast | Past tense, no exclamation | `Attendance saved.` `Fee marked paid.` |
| Confirmation | Specific, not generic | `Delete Aarav Sharma? This can’t be undone.` |
| KPI label | Noun phrase, sentence case | `Attendance today`, `Pending fees`, `Upcoming exams` |
| Helper text under input | Quiet, ≤8 words | `Used for SMS receipts.` |

### Numbers and units
- Percentages use `%` with no space: `92%`.
- Currency uses local symbol prefix: `₹4,500` / `$120`. Always grouped with commas.
- Dates in tables: `25 May 2026`. In headers / pickers: `Mon, May 25`. Never `05/25/26` — it’s ambiguous internationally.

### Emoji
**No emoji in product UI.** Status is communicated with colored dots, badges, and Lucide icons. Emoji is acceptable only in user-generated content (a parent’s message back to a teacher).

### Examples (good vs. avoid)
- ✅ `Attendance saved.` &nbsp; ❌ `Hooray! Your attendance has been saved successfully 🎉`
- ✅ `Pending fees · 12 students` &nbsp; ❌ `Yikes — 12 kids haven't paid!`
- ✅ `Generate exam` &nbsp; ❌ `✨ Generate with AI ✨`

---

## Visual Foundations

### Color
The palette is intentionally narrow. One brand color, a tight neutral ramp, four semantic colors, white surfaces.

- **Primary** `#2F6FED` Indigo — used for primary actions, active nav, links, focus rings, selected rows. Hover darkens to `#2558C8`; pressed `#1E47A8`.
- **Primary tint** `#EAF1FE` — selected nav row background, badge fill behind indigo text, subtle highlight.
- **Neutrals** — a 9-step gray ramp from `#FFFFFF` (app surface) through `#F7F8FA` (page bg) and `#E5E7EB` (borders) to `#0F172A` (primary text). See `colors_and_type.css`.
- **Semantic** — `Success #16A34A` (paid, present), `Warning #D97706` (due soon), `Danger #DC2626` (absent, overdue, destructive), `Info #0284C7` (informational only — rare).

Color carries meaning **and** is always paired with a glyph or label. Never color-only.

### Typography
**Inter** for everything. The interface uses a small scale of six sizes and three weights (400 / 500 / 600). No italics in product chrome. Numbers use Inter’s default proportional figures except in tables, where `font-variant-numeric: tabular-nums` is enforced.

```
display 28 / 36   600   page titles
h2      20 / 28   600   card titles
h3      16 / 24   600   subsection titles
body    14 / 20   400   default text
small   13 / 18   400   helper text, table meta
micro   11 / 14   500   eyebrow caps, badges
```

### Spacing
4-pt base. Tokens: `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Cards have 24px internal padding by default; dense tables drop to 12px row height. Sidebar items use 12/16. Modal padding 24.

### Radii
- `4px` — chips, tiny badges
- `8px` — buttons, inputs, dropdowns, sidebar items
- `12px` — cards (the most-used surface), table containers
- `16px` — modals, large popovers
- `full` — avatars, status dots, toggles

### Shadows
Only two:
- `--shadow-sm: 0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)` — card at rest.
- `--shadow-md: 0 4px 12px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.08)` — popovers, dropdowns, modals.

No inner shadows. No colored shadows. Hover does **not** intensify shadow — it tints the background instead (`#FAFBFC`).

### Borders
1px, `#E5E7EB`. Internal table dividers `#EEF0F3`. Focus ring is a 3px outer ring in `rgba(47,111,237,0.25)` plus a 1px solid `#2F6FED` inset.

### Backgrounds
- App surface: white (`#FFFFFF`)
- Page background under cards: `#F7F8FA`
- Sidebar: `#FFFFFF` with a single 1px right border — no separate fill.
- **No gradients.** No background patterns, no textures, no full-bleed imagery anywhere in product chrome. Hero illustrations may appear on marketing / empty-state surfaces only, and even then are flat 2-tone (indigo + light gray).

### Hover / press states
- **Hover (buttons primary):** darker indigo (`#2558C8`). 120ms ease.
- **Hover (buttons ghost / nav row):** background fades in to `#F1F3F6` (or `#EAF1FE` if currently selected).
- **Hover (table row):** background `#FAFBFC`.
- **Press:** background steps one tone darker (`#1E47A8` for primary). No transform-scale shrink.
- **Focus:** visible 3px ring (see Borders). Never `outline: none` without replacement.
- **Disabled:** 50% opacity, no hover, `cursor: not-allowed`.

### Motion
Restrained. 120–180ms `cubic-bezier(0.4, 0, 0.2, 1)` for hovers and small state changes. 220ms for modal/sheet enter (fade + 4px Y). No bouncy spring physics. No page transitions; sidebar nav swaps content instantly (SPA-style as spec’d).

### Transparency & blur
Used in exactly two places: (1) modal scrim — `rgba(15,23,42,0.4)`; (2) sticky table header gets a 4px `backdrop-filter: blur(6px)` when scrolled. Otherwise everything is opaque.

### Cards
The atomic surface. `background: #FFFFFF`, `border-radius: 12px`, `box-shadow: var(--shadow-sm)`, `border: 1px solid #EEF0F3`. The thin border keeps cards visible against the off-white page even when shadows render lightly.

### Layout rules
- Sidebar: fixed left, 240px expanded / 72px collapsed. Always visible on desktop.
- Top bar: fixed, 60px tall, white, 1px bottom border.
- Content max-width: none — pages breathe to the viewport with a 32px gutter.
- Tables full-width inside their card.
- Modals: max 560px wide, centered, with a scrim.

---

## Iconography

**System:** [Lucide](https://lucide.dev) — clean, geometric, 1.5px stroke. Loaded from CDN (`https://unpkg.com/lucide@latest`). Lucide is MIT-licensed and matches the calm SaaS aesthetic; it’s the spiritual successor to Feather and is what Notion-style and Stripe-adjacent products converge on.

**Substitution note:** Lucide is a CDN choice, not a brand-owned icon set. If EduOS later commissions or designs custom icons, swap `<i data-lucide="…">` references for the new sprite — the stroke weight (1.5px) and 20/24px sizing should stay the same.

### Usage rules
- **Default size:** 20px in nav rows, buttons, inline. 16px in dense table cells, badges. 24px reserved for empty-state hero glyphs.
- **Color:** inherits `currentColor`. In nav: `#475569` default, `#2F6FED` when active. In KPI cards: a 36px tinted-square glyph in `#2F6FED`/`#EAF1FE`.
- **Stroke weight:** never modified.
- **Pairing:** icons in nav and buttons sit 8px to the left of their label. Icon-only buttons must have an `aria-label` and a tooltip.
- **No emoji** anywhere in product chrome.
- **No flag icons or culturally-loaded glyphs.**

### Logo
EduOS uses a simple wordmark + monogram lockup. The monogram is a rounded-square “E” in indigo on white (or white on indigo, inverted). See `assets/logo.svg` and `assets/logo-mark.svg`.

---

## Index — what’s in this folder

| Path | What it is |
|---|---|
| `README.md` | This file. |
| `SKILL.md` | Agent-skill manifest — load this when designing for EduOS. |
| `colors_and_type.css` | All CSS custom properties for color, type, spacing, radius, shadow. Drop-in for any HTML artifact. |
| `assets/` | Logo, monogram, favicons, hero illustration. |
| `preview/` | Design-system preview cards (rendered in the Design System tab). |
| `ui_kits/teacher-dashboard/` | The single UI kit — School Management OS — with JSX components and a clickable index.html prototype covering all 8 pages. |

### Pages in the UI kit

Open `ui_kits/teacher-dashboard/index.html` and use the sidebar — the URL hash reflects the active page so you can deep-link to any of:

| Hash | Page | What's on it |
|---|---|---|
| `#dashboard`  | Dashboard         | KPI row · weekly attendance bar chart · fee donut · recent activity · upcoming exams |
| `#students`   | Students          | Filterable roster table · add-student modal |
| `#attendance` | Attendance        | Day's mark-present/absent/late grid · live counts · notify-parent settings |
| `#fees`       | Fees              | KPI row · invoice table · status filter · mark-paid action |
| `#results`    | Results & Exams   | Exam list · gradebook table · report-cards empty state (tabs) |
| `#exams_ai`   | AI exam builder   | Settings panel + live draft preview with MCQs and marks |
| `#parent`     | Parent portal     | 3-column messaging · thread list · conversation · student panel |
| `#settings`   | Settings          | Profile · school · classes · notifications · billing · integrations · security |

## Open questions / known caveats

- **Logo is original.** It was created in this pass because none was provided. Replace `assets/logo.svg` if a real mark exists.
- **No Inter files shipped locally** — we link Google Fonts. If offline use is needed, download `Inter-Variable.ttf` into `fonts/` and update `colors_and_type.css`.
- **Lucide is substituted as the icon system** because no brand icon set was provided.
- **No real product screenshots** were available, so the UI kit is built straight from the spec.
