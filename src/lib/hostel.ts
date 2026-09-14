export type HostelGender = 'boys' | 'girls'
export type RoomType = 'double' | 'quad' | 'dormitory'
export type BoarderPaymentStatus = 'paid' | 'due' | 'overdue'
export type GatePassStatus = 'approved' | 'active' | 'returned' | 'overdue'

export interface HostelRoom {
  id: string
  buildingName: string
  roomNo: string
  floor: number
  roomType: RoomType
  capacity: number
  occupiedBeds: number
  monthlySeatRent: number
  gender: HostelGender
}

export interface HostelBoarder {
  id: string
  studentId: string
  studentName: string
  studentNameBn: string
  className: string
  rollNo: string
  buildingName: string
  roomNo: string
  bedNo: string
  admissionDate: string
  guardianName: string
  guardianPhone: string
  monthlySeatRent: number
  monthlyMessFee: number
  paymentStatus: BoarderPaymentStatus
  emergencyContact: string
}

export interface HostelGatePass {
  id: string
  passNo: string
  studentId: string
  studentName: string
  studentNameBn: string
  buildingName: string
  roomNo: string
  guardianPhone: string
  destination: string
  reason: string
  departureDate: string
  departureTime: string
  expectedReturnDate: string
  expectedReturnTime: string
  actualReturnTime: string | null
  status: GatePassStatus
  approvedBy: string
  issueDate: string
}

/**
 * Generates an official Gate Pass / Out-Pass number token: GP-2026-0042
 */
export function generateGatePassNo(year: number, seq: number): string {
  const seqPad = String(seq).padStart(4, '0')
  return `GP-${year}-${seqPad}`
}

/**
 * Computes overall occupancy rate as an integer percentage (0-100%).
 */
export function calculateOccupancyRate(
  totalBeds: number,
  occupiedBeds: number,
): number {
  if (totalBeds <= 0) return 0
  return Math.min(100, Math.round((occupiedBeds / totalBeds) * 100))
}

/**
 * Computes total monthly hostel bill = seat rent + mess fee.
 */
export function calculateMonthlyHostelDue(
  seatRent: number,
  messFee: number,
): number {
  return (seatRent || 0) + (messFee || 0)
}

/**
 * Localized labels for room types.
 */
export function getRoomTypeLabel(
  type: RoomType,
  lang: 'en' | 'bn' = 'en',
): string {
  if (lang === 'bn') {
    switch (type) {
      case 'double':
        return 'দ্বিশয্যাবিশিষ্ট কক্ষ (২ সিট)'
      case 'quad':
        return 'চার শয্যাবিশিষ্ট কক্ষ (৪ সিট)'
      case 'dormitory':
        return 'ডরমিটরি হল (৬+ সিট)'
    }
  }
  switch (type) {
    case 'double':
      return 'Double Room (2-Bed)'
    case 'quad':
      return 'Quad Room (4-Bed)'
    case 'dormitory':
      return 'Dormitory Hall (6-Bed+)'
  }
}
