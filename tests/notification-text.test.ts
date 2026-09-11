import { describe, it, expect } from 'vitest'
import { notificationText } from '../src/lib/notification-text'
import type { AppNotification } from '../src/data/notifications'
import type { TFunction } from 'i18next'

describe('notificationText', () => {
  // Simple mock t function that substitutes keys and interpolated values
  const mockT = ((key: string, options?: Record<string, unknown>) => {
    if (!options) return key
    let str = key
    for (const [k, v] of Object.entries(options)) {
      str += ` [${k}:${v}]`
    }
    return str
  }) as unknown as TFunction

  it('formats fee_paid notification with taka', () => {
    const notif: AppNotification = {
      id: '1',
      school_id: 's-1',
      user_id: 'u-1',
      type: 'fee_paid',
      title: 'Fee received',
      params: { name: 'Amina', amount: 5000 },
      read: false,
      created_at: '',
    }
    const result = notificationText(notif, mockT, 'en')
    expect(result).toContain('notif.fee_paid')
    expect(result).toContain('[name:Amina]')
    expect(result).toContain('৳5,000')
  })

  it('formats attendance_saved notification with count formatting', () => {
    const notif: AppNotification = {
      id: '2',
      school_id: 's-1',
      user_id: 'u-1',
      type: 'attendance_saved',
      title: 'Attendance taken',
      params: { date: '2026-06-15', present: 35, absent: 5 },
      read: false,
      created_at: '',
    }
    const result = notificationText(notif, mockT, 'en')
    expect(result).toContain('notif.attendance_saved')
    expect(result).toContain('[present:35]')
    expect(result).toContain('[absent:5]')
  })

  it('falls back to title for unknown notification types', () => {
    const notif = {
      id: '3',
      school_id: 's-1',
      user_id: 'u-1',
      type: 'unknown_type',
      title: 'System Notice: Maintenance scheduled',
      params: {},
      read: false,
      created_at: '',
    } as unknown as AppNotification

    const result = notificationText(notif, mockT, 'en')
    expect(result).toBe('System Notice: Maintenance scheduled')
  })
})
