import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null)
const optionalUuid = z.union([z.literal(''), z.uuid()]).transform((value) => value || null)

export const studentFormSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  roll_no: optionalText(30),
  dob: z.union([z.literal(''), z.iso.date()]).refine(
    (value) => !value || new Date(`${value}T00:00:00`).getTime() <= Date.now(),
    { message: 'future_date' },
  ).transform((value) => value || null),
  class_id: optionalUuid,
})

export const guardianFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.union([z.literal(''), z.email().max(254)]).transform((value) => value || null),
  phone: optionalText(30),
  relationship: optionalText(60),
  primary: z.boolean(),
})

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_TYPES = new Set(['image/jpeg', 'image/png'])

export type AvatarValidationError = 'type' | 'size'

export function validateAvatar(file: File): AvatarValidationError | null {
  if (!AVATAR_TYPES.has(file.type)) return 'type'
  if (file.size > AVATAR_MAX_BYTES) return 'size'
  return null
}
