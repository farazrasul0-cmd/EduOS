import { describe, it, expect } from 'vitest'
import {
  generateGatePassNo,
  calculateOccupancyRate,
  calculateMonthlyHostelDue,
  getRoomTypeLabel,
  type HostelRoom,
  type HostelBoarder,
  type HostelGatePass,
} from '@/lib/hostel'
import {
  createHostelGatePassPdf,
  createHostelOccupancyReportPdf,
} from '@/lib/hostel-pdf'

const mockSchool = {
  schoolName: 'Ideal High School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka, Bangladesh',
  phone: '+880 1711-000000',
}

const mockGatePass: HostelGatePass = {
  id: 'PASS-1',
  passNo: 'GP-2026-0001',
  studentId: 'STU-1001',
  studentName: 'Tanvir Ahmed',
  studentNameBn: 'তানভীর আহমেদ',
  buildingName: 'Kazi Nazrul Islam Hall',
  roomNo: '201',
  guardianPhone: '+880 1711-123456',
  destination: 'Cumilla Sadar, Family Residence',
  reason: 'Sister marriage ceremony and family gathering',
  departureDate: '2026-09-18',
  departureTime: '14:00',
  expectedReturnDate: '2026-09-20',
  expectedReturnTime: '18:00',
  actualReturnTime: null,
  status: 'active',
  approvedBy: 'Prof. Rafiqul Islam (Provost)',
  issueDate: '2026-09-17',
}

const mockRooms: HostelRoom[] = [
  {
    id: 'ROOM-1',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '101',
    floor: 1,
    roomType: 'double',
    capacity: 2,
    occupiedBeds: 2,
    monthlySeatRent: 2500,
    gender: 'boys',
  },
  {
    id: 'ROOM-2',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '201',
    floor: 2,
    roomType: 'quad',
    capacity: 4,
    occupiedBeds: 3,
    monthlySeatRent: 2000,
    gender: 'girls',
  },
]

const mockBoarders: HostelBoarder[] = [
  {
    id: 'BDR-1',
    studentId: 'STU-1001',
    studentName: 'Tanvir Ahmed',
    studentNameBn: 'তানভীর আহমেদ',
    className: 'Class 9',
    rollNo: '04',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '101',
    bedNo: 'A',
    admissionDate: '2026-01-15',
    guardianName: 'Md. Shahidul Islam',
    guardianPhone: '+880 1711-123456',
    monthlySeatRent: 2500,
    monthlyMessFee: 3200,
    paymentStatus: 'paid',
    emergencyContact: '+880 1711-123456',
  },
]

describe('Hostel Domain Engine', () => {
  it('generates formatted Gate Pass serial tokens', () => {
    expect(generateGatePassNo(2026, 1)).toBe('GP-2026-0001')
    expect(generateGatePassNo(2026, 42)).toBe('GP-2026-0042')
    expect(generateGatePassNo(2026, 999)).toBe('GP-2026-0999')
  })

  it('calculates occupancy rate correctly', () => {
    expect(calculateOccupancyRate(0, 0)).toBe(0)
    expect(calculateOccupancyRate(100, 50)).toBe(50)
    expect(calculateOccupancyRate(30, 25)).toBe(83)
    expect(calculateOccupancyRate(10, 15)).toBe(100) // capped at 100
  })

  it('calculates monthly hostel total due (seat rent + mess fee)', () => {
    expect(calculateMonthlyHostelDue(2500, 3200)).toBe(5700)
    expect(calculateMonthlyHostelDue(0, 0)).toBe(0)
  })

  it('returns localized labels for room types in English and Bengali', () => {
    expect(getRoomTypeLabel('double', 'en')).toBe('Double Room (2-Bed)')
    expect(getRoomTypeLabel('quad', 'en')).toBe('Quad Room (4-Bed)')
    expect(getRoomTypeLabel('dormitory', 'en')).toBe('Dormitory Hall (6-Bed+)')

    expect(getRoomTypeLabel('double', 'bn')).toBe('দ্বিশয্যাবিশিষ্ট কক্ষ (২ সিট)')
    expect(getRoomTypeLabel('quad', 'bn')).toBe('চার শয্যাবিশিষ্ট কক্ষ (৪ সিট)')
    expect(getRoomTypeLabel('dormitory', 'bn')).toBe('ডরমিটরি হল (৬+ সিট)')
  })
})

describe('Hostel Vector PDF Generation', () => {
  it('generates valid vector A4 Portrait Out-Pass slip', () => {
    const pdfBytes = createHostelGatePassPdf(mockGatePass, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('HOSTEL STUDENT OUT-PASS')
    expect(pdfText).toContain('GP-2026-0001')
    expect(pdfText).toContain('Tanvir Ahmed')
    expect(pdfText).toContain('Kazi Nazrul Islam Hall')
    expect(pdfText).toContain('Cumilla Sadar')
    expect(pdfText).toContain('%%EOF')
  })

  it('generates valid vector A4 Landscape Occupancy Report', () => {
    const pdfBytes = createHostelOccupancyReportPdf(mockRooms, mockBoarders, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('MONTHLY HOSTEL OCCUPANCY')
    expect(pdfText).toContain('Kazi Nazrul Islam Hall')
    expect(pdfText).toContain('Begum Rokeya Bhaban')
    expect(pdfText).toContain('%%EOF')
  })
})
