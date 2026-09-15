# EduOS Module Catalog & Specifications

This catalog provides a detailed reference of all **21 core operational modules** included in **EduOS v1.0.0 Commercial MVP**.

---

## 📚 Modules Overview (1 to 21)

| # | Module Name | Route | Primary Role | PDF Document Export |
| :-: | :--- | :--- | :--- | :--- |
| **01** | Core SaaS & App Shell | `/` | All Roles | - |
| **02** | Institutional Onboarding | `/onboarding` | SuperAdmin / Principal | Institutional Setup Profile |
| **03** | Student Directory & Roster | `/students` | Admin / Teachers | Student Roster CSV / Summary |
| **04** | Attendance Management | `/attendance` | Teachers / Admin | Monthly Attendance Sheet PDF |
| **05** | Timetable & Routine Scheduler | `/timetable` | Principal / Teachers | Class & Teacher Routine A4 PDF |
| **06** | Homework & Assignments | `/assignments` | Teachers / Students | Assignment Task Sheet |
| **07** | Fees & MFS Payment Gateway | `/fees` | Accountant / Guardian | Tuition Fee Payment Receipt PDF |
| **08** | Results & NCTB Grading | `/results` | Teachers / Principal | Academic Transcript & Report Card PDF |
| **09** | Examination Routine Scheduler | `/exams` | Exam Controller | Chronological Exam Routine A4 PDF |
| **10** | Student ID Card Generator | `/students` (Modal) | Administrative Staff | CR80 PVC Standard ID Cards PDF |
| **11** | Public Online Admission Portal | `/admission-portal` | Public Applicants | Admission Application Slip PDF |
| **12** | Library & Book Circulation | `/library` | Librarian | Book Circulation & Borrowing Slip PDF |
| **13** | Staff & Teacher Payroll | `/payroll` | Accountant / Principal | Vector A4 Salary Payslip PDF |
| **14** | Transfer & Character Certificates | `/certificates` | Headmaster / Admin | Verified Transfer Certificate (TC) PDF |
| **15** | Hostel & Dormitory Management | `/hostel` | Hostel Warden | Room Roster & Student Gate Pass PDF |
| **16** | Admit Cards & Hall Seat Planner | `/admit-cards` | Exam Controller | Verified Admit Card & Seat Plan PDF |
| **17** | Tabulation Broadsheet Engine | `/results` (Broadsheet) | Exam Committee | A3 Landscape Class Broadsheet PDF |
| **18** | Staff & Student Leave Management | `/leave` | Admin / Teachers | Leave Approval Summary PDF |
| **19** | Digital Notice Board & Circulars | `/notices` | Principal / Admin | Official Notice Circular A4 PDF |
| **20** | Dedicated Parent & Student Portal | `/portal` | Parents / Students | Student Progress Dossier PDF |
| **21** | Online MCQ Quiz & Model Test | `/quizzes` | Teachers / Students | Diagnostic Performance Analysis PDF |

---

## 🔍 Module Deep Dives

### Module 02: Institutional Onboarding (`/onboarding`)
- Multi-tenant school creation with mandatory 6-digit **EIIN** validation.
- Education Board selection: Dhaka, Chittagong, Rajshahi, Comilla, Sylhet, Barisal, Jessore, Dinajpur, Mymensingh, Madrasah, Technical.
- Medium options: Bangla Medium, English Version, Madrasah (Dakhil/Alim).
- Shift configuration: Morning, Day, or Double Shift.

### Module 03: Student Directory (`/students`)
- 17-digit Bangladeshi Birth Registration Number (BRN) validation algorithm.
- Emergency guardian telephone number validation (`+8801[3-9]\d{8}`).
- CSV batch importer with column auto-mapping, row-level error reporting, and export.

### Module 07: Fees & MFS Payment Gateway (`/fees`)
- Dynamic fee structures: Monthly Tuition, Admission Fee, Examination Fee, Lab Charge, Library Dues.
- Bangladeshi Mobile Financial Services integration: **bKash** and **Nagad** TrxID verification.
- Automatic dues calculator and fee defaulter detection.
- Vector PDF Fee Payment Receipt generation with institutional header and payment timestamp.

### Module 08: NCTB Results & Grading (`/results`)
- Continuous Assessment (CA) 20% weightage + Final Summative Examination 80% weightage.
- Government NCTB GPA 5.0 scale calculation.
- 1-click single student Report Card PDF download and batch class Report Card bundle generation.

### Module 15: Admit Cards & Hall Seat Planner (`/admit-cards`)
- Automatic Tuition Fee Filter: Blocks admit card issuance for students with uncleared financial dues.
- Anti-cheating zigzag exam hall seat planner preventing students of the same class from sitting adjacently.
- Printable Admit Cards formatted with QR verification codes and Examination Controller signatures.

### Module 17: Class Tabulation Broadsheet Engine (`/results` -> Tabulation Tab)
- Full-term academic broadsheet displaying all subjects side-by-side.
- Granular breakdown: CA marks, MCQ marks, Written/CQ marks, Practical marks, Grade Point, and Letter Grade.
- Printable Vector A3 Landscape PDF export for official Education Board submissions and institutional archives.

### Module 20: Dedicated Parent & Student Portal (`/portal`)
- Dual-role authentication portal for students and their guardians.
- Multi-Child Switcher allowing parents with multiple enrolled children to toggle between profiles without logging out.
- Collegiate standing attendance indicator ($\ge 75\%$ Collegiate, $60\% - 74\%$ Non-collegiate, $< 60\%$ Discollegiate).
- Direct 1-click bKash tuition fee payment button.
- Comprehensive Progress Dossier PDF download summarizing academic, attendance, and behavioral performance.

### Module 21: Online MCQ Quiz & Model Test Assessment Engine (`/quizzes`)
- Timed online exam runner with dynamic countdown timer and palette status indicator.
- NCTB-categorized question banks with subject, chapter, and difficulty filtering.
- Bangladesh model test negative marking penalties (configurable `0.25` or `0.50` marks deduction per wrong answer).
- Instant Diagnostic Performance Analysis Vector A4 PDF export with question-by-question breakdown.
