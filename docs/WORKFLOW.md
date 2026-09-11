# Git & Feature Branch Workflow

This document establishes the official branching model and delivery workflow for **EduOS**.

---

## 1. Branch Architecture

EduOS uses an adapted **GitFlow / Trunk-based hybrid** model tailored for multi-environment SaaS delivery:

```
main          ───────────────────────● (v0.1.0)───────────────────────● (v0.2.0)
                                      ▲                                ▲
release/v*                             └─── release/v0.1.0 ─────────────┤
                                             ▲                         ▲
develop       ──●──────●─────────────●───────┴────────●────────────────┴─
                 ▲      ▲             ▲                ▲
feature/*         └── feature/toast   └── feature/mfa  └── feature/bkash-mfs
```

### Core Branches

| Branch | Purpose | Protection Rules |
| :--- | :--- | :--- |
| `main` | **Production releases**. Contains code currently deployed to production schools. | **Protected.** Direct pushes prohibited. Requires pull request with approval and passing CI. |
| `develop` | **Integration & Staging**. Active integration branch for completed features. | **Protected.** Direct pushes prohibited. Feature PRs merge here. |

### Ephemeral Branches

| Branch Type | Branching Source | Merge Destination | Naming Convention |
| :--- | :--- | :--- | :--- |
| **Feature** | `develop` | `develop` | `feature/<issue-number>-<short-description>` or `feature/<topic>` |
| **Bugfix** | `develop` | `develop` | `bugfix/<issue-number>-<short-description>` |
| **Release** | `develop` | `main` and `develop` | `release/v<MAJOR>.<MINOR>.<PATCH>` |
| **Hotfix** | `main` | `main` and `develop` | `hotfix/<short-description>` |

---

## 2. Feature Development Lifecycle (Step-by-Step)

### Step 1: Synchronize and Create Feature Branch
Always branch from the latest `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/mfs-bkash-aggregator
```

### Step 2: Make Changes & Follow Commit Standards
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```bash
git commit -m "feat(fees): integrate bKash payment verification webhook"
git commit -m "test(fees): add mock verification tests for IPN callback"
```

Prefixes:
* `feat`: New user-facing feature or capability
* `fix`: Bug fix
* `docs`: Documentation updates only
* `test`: Adding or correcting tests
* `refactor`: Code change that neither fixes a bug nor adds a feature
* `chore`: Build scripts, dependencies, CI configuration

### Step 3: Local Verification Before Pushing
Every feature branch must pass the full quality suite locally:
```bash
npm run lint    # Zero errors and zero warnings
npm test        # All test suites must pass
npm run build   # Production compilation must succeed
```

### Step 4: Open Pull Request
1. Push branch to GitHub:
   ```bash
   git push -u origin feature/mfs-bkash-aggregator
   ```
2. Open a Pull Request targeting **`develop`** (never `main` directly for features).
3. Complete all fields in the [PR template](../.github/PULL_REQUEST_TEMPLATE.md).
4. Link the corresponding GitHub Issue (e.g., `Closes #42`).

### Step 5: Review & Merge
* Automated GitHub Actions CI must pass (`Lint, Test & Build`).
* At least one code review sign-off is required.
* Merge using **Squash and merge** (or **Rebase and merge**) to maintain a clean, linear git history.
* Delete the remote branch upon merging.

---

## 3. Hotfix Workflow

When an urgent production bug occurs:
1. Branch directly from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/fix-guardian-alert-trigger
   ```
2. Implement fix, verify tests, and push.
3. Open PR into `main`.
4. After merging and tagging `main`, cherry-pick or back-merge the fix into `develop` so ongoing development stays synchronized.
