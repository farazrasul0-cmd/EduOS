import { describe, it, expect } from 'vitest'
import {
  studentFormSchema,
  guardianFormSchema,
  validateAvatar,
  AVATAR_MAX_BYTES,
} from '../src/lib/student-validation'

describe('studentFormSchema', () => {
  it('validates a correct student input', () => {
    const valid = {
      full_name: 'Tanvir Hossain',
      roll_no: '101',
      dob: '2012-05-15',
      class_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    }
    const result = studentFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.full_name).toBe('Tanvir Hossain')
      expect(result.data.roll_no).toBe('101')
      expect(result.data.dob).toBe('2012-05-15')
      expect(result.data.class_id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
    }
  })

  it('trims whitespace and transforms empty optional fields to null', () => {
    const input = {
      full_name: '   Farhan Ahmed   ',
      roll_no: '   ',
      dob: '',
      class_id: '',
    }
    const result = studentFormSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.full_name).toBe('Farhan Ahmed')
      expect(result.data.roll_no).toBeNull()
      expect(result.data.dob).toBeNull()
      expect(result.data.class_id).toBeNull()
    }
  })

  it('rejects empty or whitespace-only name', () => {
    const result = studentFormSchema.safeParse({
      full_name: '   ',
      roll_no: '',
      dob: '',
      class_id: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects names exceeding 120 characters', () => {
    const longName = 'A'.repeat(121)
    const result = studentFormSchema.safeParse({
      full_name: longName,
      roll_no: '',
      dob: '',
      class_id: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects future date of birth', () => {
    const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
    const result = studentFormSchema.safeParse({
      full_name: 'Nusrat Jahan',
      roll_no: '12',
      dob: tomorrow,
      class_id: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message === 'future_date')
      expect(issue).toBeDefined()
    }
  })

  it('rejects invalid uuid for class_id', () => {
    const result = studentFormSchema.safeParse({
      full_name: 'Nusrat Jahan',
      roll_no: '12',
      dob: '2010-01-01',
      class_id: 'not-a-valid-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('guardianFormSchema', () => {
  it('validates a valid guardian record', () => {
    const valid = {
      name: 'Mohammad Ali',
      email: 'ali@example.com',
      phone: '01711000000',
      relationship: 'Father',
      primary: true,
    }
    const result = guardianFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Mohammad Ali')
      expect(result.data.email).toBe('ali@example.com')
      expect(result.data.phone).toBe('01711000000')
      expect(result.data.relationship).toBe('Father')
      expect(result.data.primary).toBe(true)
    }
  })

  it('handles empty optional email and details', () => {
    const minimal = {
      name: 'Fatema Begum',
      email: '',
      phone: '',
      relationship: '',
      primary: false,
    }
    const result = guardianFormSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBeNull()
      expect(result.data.phone).toBeNull()
      expect(result.data.relationship).toBeNull()
      expect(result.data.primary).toBe(false)
    }
  })

  it('rejects invalid email address', () => {
    const invalid = {
      name: 'Fatema Begum',
      email: 'not-an-email',
      phone: '01812345678',
      relationship: 'Mother',
      primary: false,
    }
    const result = guardianFormSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('validateAvatar', () => {
  it('accepts valid JPEG and PNG files within 5MB', () => {
    const validJpg = new File(['dummy content'], 'avatar.jpg', { type: 'image/jpeg' })
    const validPng = new File(['dummy content'], 'avatar.png', { type: 'image/png' })

    expect(validateAvatar(validJpg)).toBeNull()
    expect(validateAvatar(validPng)).toBeNull()
  })

  it('rejects unsupported mime types', () => {
    const pdf = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' })
    const webp = new File(['dummy content'], 'avatar.webp', { type: 'image/webp' })
    const gif = new File(['dummy content'], 'avatar.gif', { type: 'image/gif' })

    expect(validateAvatar(pdf)).toBe('type')
    expect(validateAvatar(webp)).toBe('type')
    expect(validateAvatar(gif)).toBe('type')
  })

  it('rejects files larger than 5MB', () => {
    const largeBuffer = new Uint8Array(AVATAR_MAX_BYTES + 1)
    const largeFile = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' })

    expect(validateAvatar(largeFile)).toBe('size')
  })
})
