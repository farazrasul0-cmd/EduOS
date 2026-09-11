import { studentFormSchema } from '@/lib/student-validation'
import type { ClassRow, Student } from '@/types/models'
import type { NewStudent } from '@/data/students'

export interface CsvError {
  row: number
  message: string
}

export interface CsvPreview {
  valid: NewStudent[]
  errors: CsvError[]
  total: number
}

function parseLine(line: string): string[] {
  const cells: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index++
      } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      cells.push(value.trim())
      value = ''
    } else value += char
  }
  cells.push(value.trim())
  return cells
}

export function parseStudentCsv(
  text: string,
  schoolId: string,
  classes: ClassRow[],
  existing: Student[],
): CsvPreview {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { valid: [], errors: [{ row: 1, message: 'empty_file' }], total: 0 }

  const headers = parseLine(lines[0]).map((header) => header.trim().toLowerCase().replace(/[ -]+/g, '_'))
  const nameIndex = headers.indexOf('full_name') >= 0 ? headers.indexOf('full_name') : headers.indexOf('name')
  const rollIndex = headers.indexOf('roll_no') >= 0 ? headers.indexOf('roll_no') : headers.indexOf('roll')
  const dobIndex = headers.indexOf('dob') >= 0 ? headers.indexOf('dob') : headers.indexOf('date_of_birth')
  const classIndex = headers.indexOf('class') >= 0 ? headers.indexOf('class') : headers.indexOf('class_name')
  if (nameIndex < 0) return { valid: [], errors: [{ row: 1, message: 'missing_name_column' }], total: Math.max(0, lines.length - 1) }

  const classMap = new Map(classes.map((row) => [row.name.trim().toLowerCase(), row.id]))
  const existingKeys = new Set(existing.filter((row) => row.roll_no).map((row) => `${row.class_id ?? ''}|${row.roll_no!.trim().toLowerCase()}`))
  const fileKeys = new Set<string>()
  const valid: NewStudent[] = []
  const errors: CsvError[] = []

  for (let index = 1; index < lines.length; index++) {
    const cells = parseLine(lines[index])
    const className = classIndex >= 0 ? (cells[classIndex] ?? '').trim() : ''
    const classId = className ? classMap.get(className.toLowerCase()) : null
    if (className && !classId) {
      errors.push({ row: index + 1, message: `unknown_class:${className}` })
      continue
    }

    const raw = {
      full_name: cells[nameIndex] ?? '',
      roll_no: rollIndex >= 0 ? (cells[rollIndex] ?? '') : '',
      dob: dobIndex >= 0 ? (cells[dobIndex] ?? '') : '',
      class_id: classId ?? '',
    }
    const parsed = studentFormSchema.safeParse(raw)
    if (!parsed.success) {
      errors.push({ row: index + 1, message: 'invalid_values' })
      continue
    }

    const duplicateKey = parsed.data.roll_no ? `${parsed.data.class_id ?? ''}|${parsed.data.roll_no.toLowerCase()}` : null
    if (duplicateKey && (existingKeys.has(duplicateKey) || fileKeys.has(duplicateKey))) {
      errors.push({ row: index + 1, message: 'duplicate_roll' })
      continue
    }
    if (duplicateKey) fileKeys.add(duplicateKey)

    valid.push({
      school_id: schoolId,
      full_name: parsed.data.full_name,
      roll_no: parsed.data.roll_no,
      dob: parsed.data.dob,
      class_id: parsed.data.class_id,
      avatar_url: null,
    })
  }

  return { valid, errors, total: Math.max(0, lines.length - 1) }
}

export function csvErrorReport(errors: CsvError[]): string {
  return ['row,error', ...errors.map((error) => `${error.row},"${error.message.replaceAll('"', '""')}"`)].join('\n')
}
