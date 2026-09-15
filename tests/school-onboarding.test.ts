import { describe, it, expect } from 'vitest'
import {
  validateEiin,
  BANGLADESH_BOARDS,
  INSTITUTE_TYPES,
  SCHOOL_SHIFTS,
  CURRICULUM_MEDIUMS,
  DEFAULT_FEE_HEADS,
  INITIAL_WIZARD_STATE,
} from '@/lib/school-onboarding'

describe('School Onboarding Domain Engine', () => {
  describe('validateEiin', () => {
    it('accepts valid 6-digit numeric BANBEIS EIINs', () => {
      expect(validateEiin('108234')).toEqual({ valid: true })
      expect(validateEiin('134567')).toEqual({ valid: true })
      expect(validateEiin('  102030  ')).toEqual({ valid: true })
    })

    it('rejects empty or whitespace-only EIINs', () => {
      expect(validateEiin('')).toEqual({
        valid: false,
        errorKey: 'onboarding.errors.eiinRequired',
      })
      expect(validateEiin('   ')).toEqual({
        valid: false,
        errorKey: 'onboarding.errors.eiinRequired',
      })
    })

    it('rejects EIINs with length not equal to 6', () => {
      expect(validateEiin('12345')).toEqual({
        valid: false,
        errorKey: 'onboarding.errors.eiinFormat',
      })
      expect(validateEiin('1234567')).toEqual({
        valid: false,
        errorKey: 'onboarding.errors.eiinFormat',
      })
    })

    it('rejects non-numeric characters in EIIN', () => {
      expect(validateEiin('10823A')).toEqual({
        valid: false,
        errorKey: 'onboarding.errors.eiinFormat',
      })
      expect(validateEiin('EIIN12')).toEqual({
        valid: false,
        errorKey: 'onboarding.errors.eiinFormat',
      })
      expect(validateEiin('10-823')).toEqual({
        valid: false,
        errorKey: 'onboarding.errors.eiinFormat',
      })
    })
  })

  describe('Accreditation Constants', () => {
    it('contains all 11 official Bangladesh Education Boards', () => {
      expect(BANGLADESH_BOARDS).toHaveLength(11)
      const boardIds = BANGLADESH_BOARDS.map((b) => b.id)
      expect(boardIds).toContain('dhaka')
      expect(boardIds).toContain('chattogram')
      expect(boardIds).toContain('rajshahi')
      expect(boardIds).toContain('cumilla')
      expect(boardIds).toContain('sylhet')
      expect(boardIds).toContain('barishal')
      expect(boardIds).toContain('jashore')
      expect(boardIds).toContain('dinajpur')
      expect(boardIds).toContain('mymensingh')
      expect(boardIds).toContain('madrasah')
      expect(boardIds).toContain('technical')
    })

    it('defines standard institute types with default classes', () => {
      expect(INSTITUTE_TYPES.length).toBeGreaterThanOrEqual(4)
      const secondary = INSTITUTE_TYPES.find((t) => t.id === 'secondary')
      expect(secondary?.defaultClasses).toContain('Class 6')
      expect(secondary?.defaultClasses).toContain('Class 10')
    })

    it('defines shifts matching Bangladesh schooling patterns', () => {
      expect(SCHOOL_SHIFTS).toHaveLength(4)
      const shiftIds = SCHOOL_SHIFTS.map((s) => s.id)
      expect(shiftIds).toEqual(['single', 'morning', 'day', 'dual'])
    })

    it('defines curriculum mediums', () => {
      expect(CURRICULUM_MEDIUMS).toHaveLength(3)
      const mediumIds = CURRICULUM_MEDIUMS.map((m) => m.id)
      expect(mediumIds).toContain('bangla_medium')
      expect(mediumIds).toContain('english_version')
    })

    it('provides default standard fee heads in BDT', () => {
      expect(DEFAULT_FEE_HEADS.length).toBeGreaterThanOrEqual(3)
      const tuition = DEFAULT_FEE_HEADS.find((f) => f.id === 'tuition')
      expect(tuition?.amount).toBe(1500)
      expect(tuition?.period).toBe('monthly')
    })

    it('provides a complete initial wizard state', () => {
      expect(INITIAL_WIZARD_STATE.board).toBe('dhaka')
      expect(INITIAL_WIZARD_STATE.shift).toBe('single')
      expect(INITIAL_WIZARD_STATE.selectedClasses).toContain('Class 7')
      expect(INITIAL_WIZARD_STATE.feeHeads.length).toBe(4)
    })
  })
})
