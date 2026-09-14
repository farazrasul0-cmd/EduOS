import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  HostelRoom,
  HostelBoarder,
  HostelGatePass,
  RoomType,
  HostelGender,
} from '@/lib/hostel'
import { generateGatePassNo } from '@/lib/hostel'

const INITIAL_ROOMS: HostelRoom[] = [
  {
    id: 'RM-101',
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
    id: 'RM-102',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '102',
    floor: 1,
    roomType: 'quad',
    capacity: 4,
    occupiedBeds: 3,
    monthlySeatRent: 2000,
    gender: 'boys',
  },
  {
    id: 'RM-103',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '103',
    floor: 1,
    roomType: 'dormitory',
    capacity: 6,
    occupiedBeds: 4,
    monthlySeatRent: 1500,
    gender: 'boys',
  },
  {
    id: 'RM-201',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '201',
    floor: 2,
    roomType: 'double',
    capacity: 2,
    occupiedBeds: 2,
    monthlySeatRent: 2500,
    gender: 'girls',
  },
  {
    id: 'RM-202',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '202',
    floor: 2,
    roomType: 'quad',
    capacity: 4,
    occupiedBeds: 4,
    monthlySeatRent: 2000,
    gender: 'girls',
  },
  {
    id: 'RM-203',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '203',
    floor: 2,
    roomType: 'quad',
    capacity: 4,
    occupiedBeds: 2,
    monthlySeatRent: 2000,
    gender: 'girls',
  },
]

const INITIAL_BOARDERS: HostelBoarder[] = [
  {
    id: 'BDR-2026-0001',
    studentId: 'STU-1003',
    studentName: 'Tanvir Hasan',
    studentNameBn: 'তানভীর হাসান',
    className: 'Class 8',
    rollNo: '05',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '101',
    bedNo: 'Bed-A',
    admissionDate: '2024-01-10',
    guardianName: 'Golam Mostafa',
    guardianPhone: '01711998822',
    monthlySeatRent: 2500,
    monthlyMessFee: 3500,
    paymentStatus: 'paid',
    emergencyContact: '01711998822',
  },
  {
    id: 'BDR-2026-0002',
    studentId: 'STU-0901',
    studentName: 'Sabbir Hossain',
    studentNameBn: 'সাব্বির হোসেন',
    className: 'Class 10',
    rollNo: '01',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '101',
    bedNo: 'Bed-B',
    admissionDate: '2023-01-08',
    guardianName: 'Md. Shahidul Islam',
    guardianPhone: '01711998833',
    monthlySeatRent: 2500,
    monthlyMessFee: 3500,
    paymentStatus: 'paid',
    emergencyContact: '01711998833',
  },
  {
    id: 'BDR-2026-0003',
    studentId: 'STU-1005',
    studentName: 'Mahir Faisal',
    studentNameBn: 'মাহির ফয়সাল',
    className: 'Class 7',
    rollNo: '15',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '102',
    bedNo: 'Bed-A',
    admissionDate: '2025-01-12',
    guardianName: 'Enamul Kabir',
    guardianPhone: '01711998844',
    monthlySeatRent: 2000,
    monthlyMessFee: 3500,
    paymentStatus: 'due',
    emergencyContact: '01711998844',
  },
  {
    id: 'BDR-2026-0004',
    studentId: 'STU-1004',
    studentName: 'Sadia Islam',
    studentNameBn: 'সাদিয়া ইসলাম',
    className: 'Class 9',
    rollNo: '08',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '201',
    bedNo: 'Bed-A',
    admissionDate: '2023-06-15',
    guardianName: 'Mominul Haque',
    guardianPhone: '01822334411',
    monthlySeatRent: 2500,
    monthlyMessFee: 3500,
    paymentStatus: 'paid',
    emergencyContact: '01822334411',
  },
  {
    id: 'BDR-2026-0005',
    studentId: 'STU-0902',
    studentName: 'Fatima Zahra',
    studentNameBn: 'ফাতিমা জাহরা',
    className: 'Class 10',
    rollNo: '02',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '201',
    bedNo: 'Bed-B',
    admissionDate: '2023-01-10',
    guardianName: 'Nurul Huda',
    guardianPhone: '01822334422',
    monthlySeatRent: 2500,
    monthlyMessFee: 3500,
    paymentStatus: 'paid',
    emergencyContact: '01822334422',
  },
  {
    id: 'BDR-2026-0006',
    studentId: 'STU-1001',
    studentName: 'Amina Begum',
    studentNameBn: 'আমিনা বেগম',
    className: 'Class 7',
    rollNo: '03',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '202',
    bedNo: 'Bed-A',
    admissionDate: '2024-01-10',
    guardianName: 'Md. Abdur Rahim',
    guardianPhone: '01822334433',
    monthlySeatRent: 2000,
    monthlyMessFee: 3500,
    paymentStatus: 'overdue',
    emergencyContact: '01822334433',
  },
]

const INITIAL_GATE_PASSES: HostelGatePass[] = [
  {
    id: 'GP-2026-0001',
    passNo: 'GP-2026-0001',
    studentId: 'STU-1003',
    studentName: 'Tanvir Hasan',
    studentNameBn: 'তানভীর হাসান',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '101',
    guardianPhone: '01711998822',
    destination: 'Home (Kushtia)',
    reason: 'Weekend family visit',
    departureDate: '2026-09-12',
    departureTime: '04:00 PM',
    expectedReturnDate: '2026-09-14',
    expectedReturnTime: '06:00 PM',
    actualReturnTime: '2026-09-14 05:40 PM',
    status: 'returned',
    approvedBy: 'Prof. Anwarul Huq (Hall Warden)',
    issueDate: '2026-09-12',
  },
  {
    id: 'GP-2026-0002',
    passNo: 'GP-2026-0002',
    studentId: 'STU-1004',
    studentName: 'Sadia Islam',
    studentNameBn: 'সাদিয়া ইসলাম',
    buildingName: 'Begum Rokeya Bhaban',
    roomNo: '201',
    guardianPhone: '01822334411',
    destination: 'Dhaka Medical College Hospital',
    reason: 'Dental specialist consultation',
    departureDate: '2026-09-14',
    departureTime: '02:00 PM',
    expectedReturnDate: '2026-09-14',
    expectedReturnTime: '07:00 PM',
    actualReturnTime: null,
    status: 'active',
    approvedBy: 'Dr. Shahana Akhtar (Superintendent)',
    issueDate: '2026-09-14',
  },
  {
    id: 'GP-2026-0003',
    passNo: 'GP-2026-0003',
    studentId: 'STU-1005',
    studentName: 'Mahir Faisal',
    studentNameBn: 'মাহির ফয়সাল',
    buildingName: 'Kazi Nazrul Islam Hall',
    roomNo: '102',
    guardianPhone: '01711998844',
    destination: 'Sector 4, Uttara, Dhaka',
    reason: "Sister's wedding reception",
    departureDate: '2026-09-15',
    departureTime: '09:00 AM',
    expectedReturnDate: '2026-09-17',
    expectedReturnTime: '06:00 PM',
    actualReturnTime: null,
    status: 'approved',
    approvedBy: 'Prof. Anwarul Huq (Hall Warden)',
    issueDate: '2026-09-14',
  },
]

let roomsStore: HostelRoom[] = [...INITIAL_ROOMS]
let boardersStore: HostelBoarder[] = [...INITIAL_BOARDERS]
let gatePassesStore: HostelGatePass[] = [...INITIAL_GATE_PASSES]

export function resetHostelStore(): void {
  roomsStore = [...INITIAL_ROOMS]
  boardersStore = [...INITIAL_BOARDERS]
  gatePassesStore = [...INITIAL_GATE_PASSES]
}

export const HOSTEL_KEYS = {
  all: ['hostel'] as const,
  rooms: () => [...HOSTEL_KEYS.all, 'rooms'] as const,
  boarders: () => [...HOSTEL_KEYS.all, 'boarders'] as const,
  gatePasses: () => [...HOSTEL_KEYS.all, 'gatePasses'] as const,
}

export function useHostelRooms() {
  return useQuery<HostelRoom[]>({
    queryKey: HOSTEL_KEYS.rooms(),
    queryFn: async () => [...roomsStore],
    initialData: () => [...roomsStore],
    staleTime: 60 * 1000,
  })
}

export function useHostelBoarders() {
  return useQuery<HostelBoarder[]>({
    queryKey: HOSTEL_KEYS.boarders(),
    queryFn: async () => [...boardersStore],
    initialData: () => [...boardersStore],
    staleTime: 60 * 1000,
  })
}

export function useHostelGatePasses() {
  return useQuery<HostelGatePass[]>({
    queryKey: HOSTEL_KEYS.gatePasses(),
    queryFn: async () => [...gatePassesStore],
    initialData: () => [...gatePassesStore],
    staleTime: 60 * 1000,
  })
}

export function useAddHostelRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      buildingName: string
      roomNo: string
      floor: number
      roomType: RoomType
      capacity: number
      monthlySeatRent: number
      gender: HostelGender
    }) => {
      const newRoom: HostelRoom = {
        ...payload,
        id: `RM-${payload.roomNo}`,
        occupiedBeds: 0,
      }
      roomsStore.push(newRoom)
      return newRoom
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOSTEL_KEYS.all })
    },
  })
}

export function useAllocateBoarder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      studentId: string
      studentName: string
      studentNameBn?: string
      className: string
      rollNo: string
      buildingName: string
      roomNo: string
      bedNo: string
      guardianName: string
      guardianPhone: string
      monthlySeatRent: number
      monthlyMessFee?: number
    }) => {
      const newBoarder: HostelBoarder = {
        ...payload,
        id: `BDR-${new Date().getFullYear()}-${String(boardersStore.length + 1).padStart(4, '0')}`,
        studentNameBn: payload.studentNameBn || payload.studentName,
        admissionDate: new Date().toISOString().slice(0, 10),
        monthlyMessFee: payload.monthlyMessFee || 3500,
        paymentStatus: 'paid',
        emergencyContact: payload.guardianPhone,
      }

      boardersStore.push(newBoarder)

      // Increment occupied count in room
      const rmIdx = roomsStore.findIndex(
        (r) => r.roomNo === payload.roomNo && r.buildingName === payload.buildingName,
      )
      if (rmIdx !== -1) {
        roomsStore[rmIdx] = {
          ...roomsStore[rmIdx],
          occupiedBeds: Math.min(roomsStore[rmIdx].capacity, roomsStore[rmIdx].occupiedBeds + 1),
        }
      }

      return newBoarder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOSTEL_KEYS.all })
    },
  })
}

export function useVacateBoarder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (boarderId: string) => {
      const idx = boardersStore.findIndex((b) => b.id === boarderId)
      if (idx === -1) throw new Error('Boarder not found')

      const boarder = boardersStore[idx]
      boardersStore.splice(idx, 1)

      // Decrement occupied count in room
      const rmIdx = roomsStore.findIndex(
        (r) => r.roomNo === boarder.roomNo && r.buildingName === boarder.buildingName,
      )
      if (rmIdx !== -1) {
        roomsStore[rmIdx] = {
          ...roomsStore[rmIdx],
          occupiedBeds: Math.max(0, roomsStore[rmIdx].occupiedBeds - 1),
        }
      }

      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOSTEL_KEYS.all })
    },
  })
}

export function useIssueGatePass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      studentId: string
      studentName: string
      studentNameBn?: string
      buildingName: string
      roomNo: string
      guardianPhone: string
      destination: string
      reason: string
      departureDate: string
      departureTime: string
      expectedReturnDate: string
      expectedReturnTime: string
    }) => {
      const year = new Date().getFullYear()
      const passNo = generateGatePassNo(year, gatePassesStore.length + 1)
      const newPass: HostelGatePass = {
        ...payload,
        id: `GP-${year}-${String(gatePassesStore.length + 1).padStart(4, '0')}`,
        passNo,
        studentNameBn: payload.studentNameBn || payload.studentName,
        actualReturnTime: null,
        status: 'approved',
        approvedBy: 'Hall Warden Desk',
        issueDate: new Date().toISOString().slice(0, 10),
      }

      gatePassesStore = [newPass, ...gatePassesStore]
      return newPass
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOSTEL_KEYS.gatePasses() })
    },
  })
}

export function useReturnGatePass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (passId: string) => {
      const idx = gatePassesStore.findIndex((p) => p.id === passId)
      if (idx === -1) throw new Error('Gate pass not found')

      const now = new Date()
      const timeStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

      gatePassesStore[idx] = {
        ...gatePassesStore[idx],
        status: 'returned',
        actualReturnTime: timeStr,
      }
      return gatePassesStore[idx]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOSTEL_KEYS.gatePasses() })
    },
  })
}
