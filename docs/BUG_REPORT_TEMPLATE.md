# EduOS Manual Testing Bug Report Template

Use this standardized template whenever a manual testing step in [`docs/MANUAL_TESTING_ROADMAP.md`](./MANUAL_TESTING_ROADMAP.md) fails. Fill out this form and send it directly to **Codex** for diagnosis and immediate resolution.

---

## 🐞 Bug Report Form

### 1. Test Phase & Step Information
- **Testing Phase**: *(e.g. Phase E: Module E.04 Attendance Management)*
- **Step Number**: *(e.g. Step 4: Toggle Roll 7A-03 to Absent and click Save)*
- **User Role Tested**: `[ ] SuperAdmin` `[ ] Principal` `[ ] Teacher` `[ ] Accountant` `[ ] Parent` `[ ] Student` `[ ] Public Candidate`
- **Active Language**: `[ ] English` `[ ] বাংলা (Bengali)`
- **Browser & OS**: *(e.g. Chrome 128 on Windows 11)*

---

### 2. Defect Summary
*A clear, one-sentence description of what went wrong.*
> Example: Clicking "Save Attendance" displays a red toast "42501: permission denied for table attendance" and the attendance records are not saved.

---

### 3. Step-by-Step Reproduction
1. Navigate to `http://localhost:5173/...`
2. Select `...`
3. Click on `...`
4. Enter `...` into field `...`
5. Observe the error.

---

### 4. Expected Behavior vs. Actual Behavior
- **Expected Behavior**: *(What the manual testing roadmap stated should happen)*
  > Example: A green toast should confirm "Attendance recorded successfully" and records should persist in the database.
- **Actual Behavior**: *(What actually happened on your screen)*
  > Example: Red error toast appears, console prints permission error, and records reset upon page refresh.

---

### 5. Error Logs & Diagnostic Traces

#### A. Browser Console Error Trace (Press F12 -> Console)
```text
[Paste full red error message and stack trace from DevTools Console here]
```

#### B. Network Request Details (Press F12 -> Network -> Fetch/XHR)
- **Request URL**: *(e.g. https://xyz.supabase.co/rest/v1/attendance)*
- **HTTP Method**: `[ ] GET` `[ ] POST` `[ ] PATCH` `[ ] DELETE`
- **HTTP Status Code**: *(e.g. 403 Forbidden / 500 Internal Server Error)*
- **Response Payload**:
```json
{
  "code": "42501",
  "message": "new row violates row-level security policy for table \"attendance\""
}
```

#### C. Terminal / PowerShell Output (if command line failure)
```powershell
[Paste PowerShell terminal output and error message here]
```

---

### 6. Screenshots / Visual Evidence
- **UI Error Screenshot**: `[Attach screenshot or describe visual layout bug]`
- **Console Screenshot**: `[Attach console screenshot if applicable]`

---

### 7. Severity Assessment
- `[ ] Critical (P0)` — Blocks entire testing roadmap (application crashed, auth failed, data corrupted).
- `[ ] High (P1)` — Major module feature broken; cannot complete current phase.
- `[ ] Medium (P2)` — Visual glitch, styling defect, or non-blocking functional anomaly.
- `[ ] Low (P3)` — Minor typo, translation wording polish, or cosmetic discrepancy.
