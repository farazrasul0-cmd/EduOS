import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

function getNestedKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(getNestedKeys(val as Record<string, unknown>, fullPath))
    } else {
      keys.push(fullPath)
    }
  }
  return keys
}

describe('i18n translation parity (English vs Bengali)', () => {
  const enPath = path.resolve(__dirname, '../src/i18n/locales/en.json')
  const bnPath = path.resolve(__dirname, '../src/i18n/locales/bn.json')

  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'))
  const bn = JSON.parse(fs.readFileSync(bnPath, 'utf-8'))

  const enKeys = getNestedKeys(en)
  const bnKeys = getNestedKeys(bn)

  it('contains valid non-empty JSON files', () => {
    expect(enKeys.length).toBeGreaterThan(100)
    expect(bnKeys.length).toBeGreaterThan(100)
  })

  it('has every English key translated in Bengali', () => {
    const missingInBn = enKeys.filter((k) => !bnKeys.includes(k))
    expect(missingInBn, `Keys present in en.json but missing in bn.json:\n${missingInBn.join('\n')}`).toEqual([])
  })

  it('has every Bengali key defined in English', () => {
    const missingInEn = bnKeys.filter((k) => !enKeys.includes(k))
    expect(missingInEn, `Keys present in bn.json but missing in en.json:\n${missingInEn.join('\n')}`).toEqual([])
  })

  it('has exact matching total key counts', () => {
    expect(bnKeys.length).toEqual(enKeys.length)
  })
})
