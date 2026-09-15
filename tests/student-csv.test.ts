import { describe, it, expect } from 'vitest'
import { parseStudentCsv, csvErrorReport } from '../src/lib/student-csv'
import type { ClassRow, Student } from '../src/types/models'

describe('parseStudentCsv', () => {
  const schoolId = 'school-123'
  const mockClasses: ClassRow[] = [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      school_id: schoolId,
      name: 'Class 7A',
      grade_level: 7,
      section: 'A',
      room: '101',
      capacity: 40,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      school_id: schoolId,
      name: 'Class 8B',
      grade_level: 8,
      section: 'B',
      room: '102',
      capacity: 40,
      created_at: '',
      updated_at: '',
    },
  ]

  it('handles empty input', () => {
    const res = parseStudentCsv('', schoolId, mockClasses, [])
    expect(res.valid).toHaveLength(0)
    expect(res.errors).toEqual([{ row: 1, message: 'empty_file' }])
    expect(res.total).toBe(0)
  })

  it('rejects CSV when name column is missing', () => {
    const csv = 'roll_no,dob,class\n101,2010-01-01,Class 7A'
    const res = parseStudentCsv(csv, schoolId, mockClasses, [])
    expect(res.valid).toHaveLength(0)
    expect(res.errors).toEqual([{ row: 1, message: 'missing_name_column' }])
  })

  it('parses valid CSV rows with class lookup', () => {
    const csv = `full_name,roll_no,dob,class
Sadia Islam,101,2012-03-10,Class 7A
Kamal Hossain,102,2011-09-20,Class 8B`

    const res = parseStudentCsv(csv, schoolId, mockClasses, [])
    expect(res.errors).toHaveLength(0)
    expect(res.valid).toHaveLength(2)
    expect(res.valid[0]).toEqual({
      school_id: schoolId,
      full_name: 'Sadia Islam',
      roll_no: '101',
      dob: '2012-03-10',
      class_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      avatar_url: null,
    })
    expect(res.valid[1].class_id).toBe('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22')
  })

  it('flags unknown classes', () => {
    const csv = `full_name,roll_no,class
Sadia Islam,101,Nonexistent Class`

    const res = parseStudentCsv(csv, schoolId, mockClasses, [])
    expect(res.valid).toHaveLength(0)
    expect(res.errors).toEqual([{ row: 2, message: 'unknown_class:Nonexistent Class' }])
  })

  it('flags duplicate rolls within file or against existing students', () => {
    const existing: Student[] = [
      {
        id: 's-1',
        school_id: schoolId,
        full_name: 'Existing Student',
        roll_no: '101',
        dob: null,
        class_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        avatar_url: null,
        created_at: '',
        updated_at: '',
      },
    ]

    const csv = `full_name,roll_no,class
Student Two,101,Class 7A
Student Three,105,Class 7A
Student Four,105,Class 7A`

    const res = parseStudentCsv(csv, schoolId, mockClasses, existing)
    expect(res.valid).toHaveLength(1)
    expect(res.valid[0].full_name).toBe('Student Three')
    expect(res.errors).toEqual([
      { row: 2, message: 'duplicate_roll' }, // conflicts with existing
      { row: 4, message: 'duplicate_roll' }, // conflicts with row 3 in file
    ])
  })

  it('formats csvErrorReport properly', () => {
    const report = csvErrorReport([
      { row: 2, message: 'unknown_class:Class 9' },
      { row: 3, message: 'invalid_values' },
    ])
    expect(report).toContain('row,error')
    expect(report).toContain('2,"unknown_class:Class 9"')
    expect(report).toContain('3,"invalid_values"')
  })
})
