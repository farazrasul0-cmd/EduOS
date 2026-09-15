import { describe, it, expect } from 'vitest'
import {
  generateAdmitCardNo,
  evaluateFeeClearance,
  generateZigzagSeatPlan,
  type AdmitCardCandidate,
  type ExamHall,
} from '@/lib/admit-card'
import {
  createStudentAdmitCardPdf,
  createExamHallDoorNoticePdf,
  createBenchStickersPdf,
} from '@/lib/admit-card-pdf'

const mockSchool = {
  schoolName: 'Ideal High School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka, Bangladesh',
  phone: '+880 1711-000000',
}

const mockCandidate: AdmitCardCandidate = {
  id: 'CAND-01',
  admitCardNo: 'AC-2026-0001',
  studentId: 'STU-1001',
  studentName: 'Amina Begum',
  studentNameBn: 'আমিনা বেগম',
  className: 'Class 7',
  section: 'A',
  rollNo: '01',
  gender: 'female',
  guardianName: 'Md. Abdur Rahim',
  guardianPhone: '01711000001',
  feeDueAmount: 0,
  clearanceStatus: 'cleared',
  examTitle: 'Half-Yearly Examination 2026',
  academicYear: '2026',
  subjects: [
    {
      subjectCode: '101',
      subjectName: 'Bangla 1st Paper',
      examDate: '2026-06-15',
      dayOfWeek: 'Monday',
      timeSlot: '10:00 AM - 1:00 PM',
      totalMarks: 100,
      room: 'Room 101',
    },
    {
      subjectCode: '109',
      subjectName: 'Mathematics',
      examDate: '2026-06-23',
      dayOfWeek: 'Tuesday',
      timeSlot: '10:00 AM - 1:00 PM',
      totalMarks: 100,
      room: 'Room 101',
    },
  ],
}

const mockHalls: ExamHall[] = [
  {
    id: 'HALL-101',
    roomName: 'Room 101',
    building: 'Academic Bhaban',
    floor: 1,
    totalBenches: 5,
    seatsPerBench: 2,
    invigilatorName: 'Md. Nazmul Huda',
    invigilatorPhone: '01711223344',
  },
]

const mockCandidatesForSeating: AdmitCardCandidate[] = [
  { ...mockCandidate, id: 'C-1', className: 'Class 9', rollNo: '01', studentName: 'Student 9-1' },
  { ...mockCandidate, id: 'C-2', className: 'Class 9', rollNo: '02', studentName: 'Student 9-2' },
  { ...mockCandidate, id: 'C-3', className: 'Class 10', rollNo: '01', studentName: 'Student 10-1' },
  { ...mockCandidate, id: 'C-4', className: 'Class 10', rollNo: '02', studentName: 'Student 10-2' },
]

describe('Admit Card Domain Engine', () => {
  it('generates formatted Admit Card sequence tokens', () => {
    expect(generateAdmitCardNo(2026, 1)).toBe('AC-2026-0001')
    expect(generateAdmitCardNo(2026, 42)).toBe('AC-2026-0042')
    expect(generateAdmitCardNo(2026, 5, '09')).toBe('AC-2026-09005')
  })

  it('evaluates fee clearance correctly', () => {
    // Zero due
    const cleared = evaluateFeeClearance(0)
    expect(cleared.canIssue).toBe(true)
    expect(cleared.status).toBe('cleared')

    // Unpaid due without override
    const withheld = evaluateFeeClearance(2500, false)
    expect(withheld.canIssue).toBe(false)
    expect(withheld.status).toBe('withheld')

    // Unpaid due with official override
    const overridden = evaluateFeeClearance(2500, true)
    expect(overridden.canIssue).toBe(true)
    expect(overridden.status).toBe('overridden')
  })

  it('generates alternating / zigzag seat plan pairing different classes on the same bench', () => {
    const result = generateZigzagSeatPlan(mockHalls, mockCandidatesForSeating)
    expect(result.totalSeated).toBe(4)
    expect(result.hallsUsed).toBe(1)
    expect(result.overflowCandidates.length).toBe(0)

    // Verify bench 1 has students from different classes
    const bench1Allocations = result.allocations.filter((a) => a.benchNo === 1)
    expect(bench1Allocations.length).toBe(2)
    const leftStudent = bench1Allocations.find((a) => a.seatPosition === 'Left')
    const rightStudent = bench1Allocations.find((a) => a.seatPosition === 'Right')

    expect(leftStudent).toBeDefined()
    expect(rightStudent).toBeDefined()
    // Anti-cheating verification: Left and Right seats on the bench must NOT share the same class
    expect(leftStudent?.candidate.className).not.toBe(rightStudent?.candidate.className)
  })
})

describe('Admit Card & Seating Vector PDF Generators', () => {
  it('generates official vector A4 Student Admit Card PDF', () => {
    const pdfBytes = createStudentAdmitCardPdf(mockCandidate, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('EXAMINATION ADMIT CARD')
    expect(pdfText).toContain('AC-2026-0001')
    expect(pdfText).toContain('Amina Begum')
    expect(pdfText).toContain('Bangla 1st Paper')
    expect(pdfText).toContain('%%EOF')
  })

  it('generates official vector A4 Landscape Hall Door Notice PDF', () => {
    const planResult = generateZigzagSeatPlan(mockHalls, mockCandidatesForSeating)
    const pdfBytes = createExamHallDoorNoticePdf(
      mockHalls[0],
      planResult.allocations,
      'Half-Yearly Examination 2026',
      mockSchool,
    )
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('EXAMINATION HALL DOOR NOTICE')
    expect(pdfText).toContain('Room 101')
    expect(pdfText).toContain('Bench 1')
    expect(pdfText).toContain('%%EOF')
  })

  it('generates official vector A4 sheet of Bench Stickers PDF', () => {
    const planResult = generateZigzagSeatPlan(mockHalls, mockCandidatesForSeating)
    const pdfBytes = createBenchStickersPdf(planResult.allocations, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('EXAM BENCH STICKERS')
    expect(pdfText).toContain('BENCH 1')
    expect(pdfText).toContain('%%EOF')
  })
})
