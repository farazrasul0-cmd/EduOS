# EduOS System Architecture Specification

This document details the architectural design, security boundaries, database modeling, and domain computation engines powering **EduOS**.

---

## 🏛️ High-Level System Architecture

EduOS is architected as a modern, decoupled, multi-tenant SaaS application designed to scale across thousands of educational institutions in Bangladesh:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Presentation Tier                       │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │   Administrative Web     │  │   Dedicated Parent & Student Portal  │ │
│  │  (Principals, Teachers)  │  │   (Multi-Child Switcher, bKash Pay)  │ │
│  └──────────────────────────┘  └──────────────────────────────────────┘ │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │ Public Admission Portal  │  │   Mobile / Responsive Web App (PWA)  │ │
│  │  (17-digit BRN Checks)   │  │   (Offline Sync Detection Banner)    │ │
│  └──────────────────────────┘  └──────────────────────────────────────┘ │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / WebSocket
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Application Core & Execution Tier                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ React 19 • TypeScript • Vite 8 • Tailwind CSS v4 • Router 7       │  │
│  ├─────────────────────────────────┬─────────────────────────────────┤  │
│  │ i18next Bilingual Engine (EN/BN)│ TanStack Query v5 Server Cache  │  │
│  ├─────────────────────────────────┼─────────────────────────────────┤  │
│  │ NCTB Continuous Assessment Math │ Conflict-Free Routine Generator │  │
│  ├─────────────────────────────────┼─────────────────────────────────┤  │
│  │ Vector PDF Generator (CR80/A4/A3│ Timed MCQ Quiz Runner & Engine  │  │
│  └─────────────────────────────────┴─────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Authenticated Supabase Client (JWT)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Security & Data Persistence Tier                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ PostgreSQL 16 Multi-Tenant Schema with Row-Level Security (RLS)   │  │
│  │ Constraint: school_id = auth_school_id()                          │  │
│  ├─────────────────────────────────┬─────────────────────────────────┤  │
│  │ Append-Only Audit Logging Trail │ Supabase Storage (Photos & Files)│  │
│  ├─────────────────────────────────┴─────────────────────────────────┤  │
│  │ 23 Migration Schemas • Foreign Key Cascades • Realtime Replication│  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ API / Webhooks
┌────────────────────────────────────▼────────────────────────────────────┐
│                 Bangladesh Local Ecosystem Integrations                 │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │  bKash & Nagad MFS APIs  │  │      Local SMS Gateway Adapter       │ │
│  │ (TrxID Reconciliation)   │  │  (Absence Broadcasts & Notices)      │ │
│  └──────────────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Multi-Tenant Security & Row-Level Security (RLS)

EduOS implements strict tenant isolation via PostgreSQL Row-Level Security (RLS). Every multi-tenant table (e.g. `students`, `invoices`, `attendance`, `exams`, `marks`, `payroll`, `hostel_rooms`, `quizzes`) contains a non-nullable `school_id UUID` column linked to `schools(id)`.

### RLS Policy Pattern:
```sql
-- Helper function to resolve the current user's school context
CREATE OR REPLACE FUNCTION public.auth_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enforce isolation on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_students" ON public.students
  FOR ALL
  USING (school_id = auth_school_id())
  WITH CHECK (school_id = auth_school_id());
```

This ensures that even in the case of misconfigured client queries, cross-tenant data leaks are physically blocked at the database engine level.

---

## 🧮 NCTB Continuous Assessment & Tabulation Mathematics

EduOS strictly enforces the National Curriculum and Textbook Board (NCTB) grading regulations for primary, secondary, and higher secondary institutions:

### Assessment Weighting Formula
$$\text{Total Subject Score} = (\text{Continuous Assessment Mark} \times 0.20) + (\text{Summative Exam Mark} \times 0.80)$$

### NCTB Grading Scale Cutoffs
| Percentage Range | Grade Point (GP) | Letter Grade | Evaluation Remark |
| :---: | :---: | :---: | :---: |
| $80\% - 100\%$ | **5.00** | **A+** | Outstanding |
| $70\% - 79\%$ | **4.00** | **A** | Excellent |
| $60訊 - 69\%$ | **3.50** | **A-** | Very Good |
| $50\% - 59\%$ | **3.00** | **B** | Good |
| $40\% - 49\%$ | **2.00** | **C** | Satisfactory |
| $33\% - 39\%$ | **1.00** | **D** | Pass |
| $0\% - 32\%$ | **0.00** | **F** | Fail |

### Term GPA Calculation
$$\text{Term GPA} = \frac{\sum (\text{Subject Grade Point})}{\text{Total Mandatory Subjects}}$$

If a student receives an **F** in any compulsory subject, their cumulative Term GPA is evaluated to **0.00 (Fail)**, adhering strictly to Bangladesh Board Examination rules.

---

## 📄 Official Vector PDF Generation Engine

EduOS features zero-dependency, ultra-crisp vector document rendering directly in the browser or server-side:

| Document Type | Format | Dimensions | Security Features |
| :--- | :--- | :--- | :--- |
| **Student ID Card** | CR80 PVC | $54 \times 86\text{ mm}$ ($153 \times 243\text{ pt}$) | High-res Photo, Barcode, Verification QR |
| **Admit Card** | Vector A4 (Multi-card) | $595 \times 842\text{ pt}$ | Tuition Fee Dues Filter, Anti-cheating Seat Plan, QR |
| **Report Card** | Vector A4 Portrait | $595 \times 842\text{ pt}$ | Subject breakdown, Teacher remarks, Triple Signatures |
| **Tabulation Broadsheet** | Vector A3 Landscape | $1190 \times 842\text{ pt}$ | Term CA 20% + 80% matrix, Class Merit Rank |
| **Transfer Certificate (TC)** | Vector A4 Portrait | $595 \times 842\text{ pt}$ | Ornate border, Unique Anti-tamper Verification Token |
| **Payment Receipt** | Vector A4 Half / Thermal | Custom slip | TrxID, MFS channel identifier, BDT Currency |

---

## 💳 Mobile Financial Services (MFS) Payment Flow

EduOS provides direct reconciliation for Bangladesh's leading mobile financial services:

1. **Invoice Generation**: Generated monthly based on institutional fee structure.
2. **Payment Channel Selection**: Guardian selects bKash or Nagad.
3. **MFS Transaction Verification**:
   - Validates Bangladesh mobile wallet format (`+8801[3-9]\d{8}`).
   - Validates alphanumeric Transaction ID (`TrxID`, e.g. `BKASH-9A27F104`).
   - Atomic database settlement update: marks invoice as `paid`, creates audit receipt record, and unlocks student admit cards.
