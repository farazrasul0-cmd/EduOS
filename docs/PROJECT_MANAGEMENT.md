# GitHub Project Management Workflow

This guide specifies how **GitHub Projects (v2)** boards are structured, prioritized, and automated for **EduOS**.

---

## 1. Project Board Layout (Kanban Columns)

```
┌───────────┐   ┌───────────┐   ┌─────────────┐   ┌─────────────┐   ┌───────────┐   ┌───────────┐
│  Backlog  │──▶│   Ready   │──▶│ In Progress │──▶│  In Review  │──▶│  Staging  │──▶│   Done    │
└───────────┘   └───────────┘   └─────────────┘   └─────────────┘   └───────────┘   └───────────┘
```

| Column | Purpose | Exit Criteria |
| :--- | :--- | :--- |
| **📋 Backlog** | Unscheduled features, user feedback, and technical debt. | Card has acceptance criteria, priority tag, and estimated milestone. |
| **🎯 Ready** | Groomed and scheduled tasks ready for immediate pickup. | Assigned to a developer with an agreed implementation plan. |
| **🏗️ In Progress** | Active coding. Card must have an assigned owner and feature branch. | Code written, local tests pass, ready for PR. |
| **🔍 In Review** | PR opened against `develop`. Undergoing review & automated CI. | CI green + required reviewer approvals acquired. |
| **🧪 Staging** | Merged into `develop` and deployed to staging environment. | Validated in staging environment with demo accounts. |
| **🚀 Done** | Merged to `main` and included in a tagged production release. | Deployed to production. |

---

## 2. Standard Issue Fields & Labels

### Priority Levels
* **`P0 - Urgent`**: Security vulnerability, data loss risk, or production-halting regression. Must be addressed immediately.
* **`P1 - High`**: Core functional workflow, compliance requirement, or essential UX quality gate.
* **`P2 - Medium`**: Enhancements, secondary integrations (MFS, SMS), optimization, or scheduled features.
* **`P3 - Low`**: Minor cosmetic polish, internal chore, or exploratory enhancement.

### Domain Labels
* `domain:auth` (Authentication, RLS, onboarding, permissions)
* `domain:students` (Student roster, guardians, admissions)
* `domain:attendance` (Daily attendance, leave, parent notifications)
* `domain:fees` (Fee plans, invoices, payments, receipts)
* `domain:exams` (Exams, question papers, AI builder)
* `domain:results` (Gradebook, marks, report cards, GPA)
* `domain:assignments` (Assignments, files, submissions, grading)
* `domain:timetable` (Schedule slots, clash detection)
* `domain:messages` (Realtime parent chat, notifications)
* `domain:settings` (Classes, billing, security, integrations)

---

## 3. GitHub Automation Rules

Configure the following built-in GitHub Project automations:

1. **Item Added**: When an issue is opened with label `bug` or `enhancement`, automatically add it to the Project in **Backlog**.
2. **Pull Request Linked**: When a branch or pull request is linked to an issue and work begins, move the issue to **In Progress**.
3. **Pull Request Awaiting Review**: When a PR is marked ready for review, move the card to **In Review**.
4. **Pull Request Merged**: When a PR is merged into `develop`, move the card to **Staging**.
5. **Issue Closed / Release Cut**: When the release is merged to `main` and tagged, move the card to **Done**.
