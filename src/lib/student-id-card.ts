export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const
export type BloodGroup = (typeof BLOOD_GROUPS)[number]

export interface StudentIdCardData {
  id: string
  studentId: string
  studentName: string
  rollNo?: string | null
  className?: string | null
  section?: string | null
  bloodGroup?: string | null
  dob?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  schoolName: string
  schoolAddress?: string | null
  eiin?: string | null
  academicYear: string
  validUntil?: string | null
  avatarUrl?: string | null
  verificationUrl?: string | null
}

/**
 * Generates a clean, standardized student ID token (e.g. STU-2026-0042).
 */
export function generateStudentId(
  rollNo?: string | null,
  year: string | number = new Date().getFullYear(),
  fallbackId?: string,
): string {
  const rollNum = rollNo ? parseInt(rollNo, 10) : NaN
  if (!Number.isNaN(rollNum) && rollNum > 0) {
    return `STU-${year}-${String(rollNum).padStart(4, '0')}`
  }
  if (fallbackId) {
    const cleanId = fallbackId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()
    return `STU-${year}-${cleanId.padStart(4, '0')}`
  }
  return `STU-${year}-0001`
}

/**
 * Validates whether a given blood group matches standard medical classifications.
 */
export function validateBloodGroup(bg?: string | null): boolean {
  if (!bg) return false
  const trimmed = bg.trim().toUpperCase()
  return (BLOOD_GROUPS as readonly string[]).includes(trimmed)
}

/**
 * Formats blood group or returns fallback.
 */
export function formatBloodGroup(bg?: string | null): string {
  if (!bg) return 'N/A'
  const trimmed = bg.trim().toUpperCase()
  return validateBloodGroup(trimmed) ? trimmed : 'N/A'
}

/**
 * Generates a 21x21 QR code matrix (standard QR Version 1 dimensions) with authentic
 * finder patterns (top-left, top-right, bottom-left), timing patterns, and deterministic
 * data modules derived from the content string.
 */
export function generateQrPattern(content: string): boolean[][] {
  const size = 21
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  // Helper to draw 7x7 finder pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true
        } else {
          matrix[startY + r][startX + c] = false
        }
      }
    }
  }

  // Draw 3 finder patterns
  drawFinder(0, 0) // Top-Left
  drawFinder(size - 7, 0) // Top-Right
  drawFinder(0, size - 7) // Bottom-Left

  // Draw timing patterns (row 6 and col 6)
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // Separator margins around finders (white)
  for (let i = 0; i < 8; i++) {
    matrix[7][i] = false
    matrix[i][7] = false
    matrix[7][size - 1 - i] = false
    matrix[i][size - 8] = false
    matrix[size - 8][i] = false
    matrix[size - 1 - i][7] = false
  }

  // Generate deterministic data modules from content hash
  let hash = 0x811c9dc5
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  let seed = Math.abs(hash)
  const lcg = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder and timing regions
      const inTopLeft = r < 9 && c < 9
      const inTopRight = r < 9 && c >= size - 8
      const inBottomLeft = r >= size - 8 && c < 9
      const inTiming = r === 6 || c === 6

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        matrix[r][c] = lcg() > 0.48
      }
    }
  }

  return matrix
}

/**
 * Generates Code 39 / 128 style bar widths for visual barcode rendering.
 * Returns an array of alternating bar / space widths (1 = narrow, 2 = wide).
 */
export function generateBarcodeBars(code: string): number[] {
  const clean = (code || 'EDUOS').toUpperCase().replace(/[^A-Z0-9-]/g, '')
  const bars: number[] = [1, 1, 1, 1] // Start delimiter

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i)
    // 5 bars per character
    bars.push((charCode % 2) + 1)
    bars.push(1)
    bars.push(((charCode >> 1) % 2) + 1)
    bars.push(1)
    bars.push(((charCode >> 2) % 2) + 1)
    bars.push(1) // inter-character space
  }

  bars.push(2, 1, 1, 2) // Stop delimiter
  return bars
}
