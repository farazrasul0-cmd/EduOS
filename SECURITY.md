# Security Policy

The EduOS engineering team takes the security of school institutions, student records, academic grading integrity, and financial transactions extremely seriously.

---

## Supported Versions

Only the latest major and minor releases of EduOS receive security patches and active support:

| Version | Supported          | Security Maintenance Level |
| ------- | ------------------ | -------------------------- |
| `1.0.x` | :white_check_mark: | Active production support  |
| `< 1.0` | :x:                | Deprecated (pre-release)   |

---

## Reporting a Vulnerability

If you discover a potential security vulnerability within EduOS (including tenant isolation flaws, auth bypass, SQL/RLS leakages, or financial ledger tamper vectors), **please do not disclose it publicly on GitHub Issues or discussions.**

Instead, report it directly to our security team via:
- **Email**: `security@eduos.bd` (or `farazrasul0@gmail.com`)
- **PGP Key**: Available upon request for encrypted disclosure.

### What to Include in Your Report
1. **Description**: A clear summary of the issue and its potential impact.
2. **Reproduction Steps**: Step-by-step instructions or Proof of Concept (PoC).
3. **Affected Component**: Affected route, API endpoint, database migration, or RLS policy.
4. **Suggested Mitigation**: If you have identified a potential fix or patch.

### Response Timelines
- **Initial Acknowledgement**: Within 24 hours.
- **Triage & Impact Assessment**: Within 72 hours.
- **Patch Release & Advisory**: Within 7 days for critical vulnerabilities.

---

## Core Security Architecture Guarantees

### 1. Multi-Tenant Isolation via Row-Level Security (RLS)
All database tables in EduOS carry a mandatory `school_id` foreign key. Multi-tenant isolation is strictly enforced at the PostgreSQL database engine layer via Row-Level Security:
```sql
CREATE POLICY "tenant_isolation_policy" ON public.students
  FOR ALL
  USING (school_id = auth_school_id());
```
Even if a client query lacks a tenant filter, the database rejects any cross-tenant data access.

### 2. Role-Based Access Control (RBAC)
User permissions are compartmentalized across distinct institutional roles:
- `super_admin`: Platform administration and multi-tenant provisioning.
- `owner` / `principal`: Institutional policy, examination signoff, and fee structure approval.
- `teacher`: Attendance marking, marksheet entry, homework review, and leave requests.
- `accountant`: Tuition invoicing, bKash/Nagad MFS reconciliation, and salary disbursements.
- `guardian` / `parent`: Read-only child portal, collegiate attendance status, and direct fee payment.
- `student`: View homework, attempt online MCQ quizzes, download admit cards and report cards.

### 3. Immutable Append-Only Audit Logging
All critical institutional mutations (attendance changes, exam mark adjustments, fee receipt waivers, and user role updates) trigger immutable audit log entries recording:
- `actor_id`, `school_id`, `action`, `resource_type`, `resource_id`, `previous_state`, `new_state`, `ip_address`, `timestamp`.

### 4. Anti-Tamper Verification Tokens
All official institutional exports (Transfer Certificates, Character Certificates, and Admit Cards) embed cryptographically unique verification tokens and dynamic QR codes for physical anti-forgery validation.
