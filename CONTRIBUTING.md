# Contributing to EduOS

Thank you for your interest in contributing to **EduOS**! We welcome community contributions, bug fixes, localized features, and documentation enhancements to advance modern digital school governance across Bangladesh.

---

## 🧭 Branching Strategy

EduOS follows a Git Flow development model:
- `main`: Production-ready code matching the current live release (`v1.0.0-mvp`). Direct commits are forbidden.
- `develop`: Integration branch where tested features converge before release.
- `feature/<module-name>`: Dedicated branches for new features and functional enhancements.
- `bugfix/<issue-id>`: Dedicated branches for defect fixes.
- `docs/<topic>`: Documentation and visual asset updates.

```text
main           ───────────────────────● (v1.0.0-mvp)
                                      ▲
develop        ───●───────●───────●───┤
                   \     / \     /
feature/*           └───●   └───●
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` / `v24.x`
- **npm**: `v10+`
- **Git**: Modern git client
- **Supabase CLI** (optional for local PostgreSQL instance)

### 2. Installation
```bash
# Clone your fork
git clone https://github.com/farazrasul0-cmd/EduOS.git
cd EduOS

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Launch Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to explore the application.

---

## 📋 Commit Message Guidelines

We enforce the [Conventional Commits specification](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <short description in present tense>

[optional body describing rationale]

[optional footer(s) referencing issue number, e.g., Closes #42]
```

### Allowed Types:
- `feat`: New feature or user-facing capability
- `fix`: Bug fix or patch
- `docs`: Documentation updates
- `style`: Formatting, whitespace (no code logic changes)
- `refactor`: Code refactoring without behavior change
- `perf`: Performance optimization
- `test`: Adding or modifying test suites
- `chore`: Build tooling, dependency bumps, release tags

### Common Scopes:
`attendance`, `fees`, `grading`, `admissions`, `admit-cards`, `hostel`, `payroll`, `library`, `portal`, `quizzes`, `i18n`, `security`.

---

## 🧪 Quality Gates & Verification

Before submitting a Pull Request, verify all quality gates pass locally:

```bash
# 1. Run full test suite (53 suites, 311+ tests)
npm test

# 2. Run static analysis & ESLint check (must have 0 errors and 0 warnings)
npm run lint

# 3. Verify TypeScript type-checking and production bundle build
npm run build

# 4. Verify 100% bilingual translation key parity
npx vitest run tests/i18n-parity.test.ts
```

---

## 🌐 Localization Guidelines (English & বাংলা)

EduOS is strictly bilingual:
- Never hardcode English or Bengali text directly in JSX components.
- Always wrap user-facing text with `t('namespace.key')`.
- Ensure newly added keys exist in **both** `src/i18n/locales/en.json` and `src/i18n/locales/bn.json`.
- Use `formatTaka(amount)` for currency formatting (`৳`).
- Use `formatNumber(num)` or date-fns Bengali locale for date and numeral display.

---

## 🤝 Pull Request Checklist

When submitting a PR:
1. Ensure your branch is rebased on latest `origin/develop`.
2. Include a concise summary of the changes and link related issues.
3. Attach screenshots or terminal outputs validating the behavior.
4. Verify all automated tests pass with 100% green status.
