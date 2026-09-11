import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { School } from '@/types/models'

export function useSchool(schoolId: string | null | undefined) {
  return useQuery({
    queryKey: ['school', schoolId],
    enabled: !!schoolId,
    queryFn: async (): Promise<School | null> => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId as string)
        .maybeSingle()
      if (error) throw error
      return (data as School | null) ?? null
    },
  })
}

export interface SchoolUpdate {
  name?: string
  affiliation?: string | null
  address?: string | null
  academic_year?: string | null
}

export function useUpdateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; update: SchoolUpdate }) => {
      const { error } = await supabase.from('schools').update(input.update).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_d, input) => {
      void qc.invalidateQueries({ queryKey: ['school', input.id] })
    },
  })
}

export interface ProfileUpdate {
  full_name?: string
  phone?: string | null
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (input: { id: string; update: ProfileUpdate }) => {
      const { error } = await supabase.from('profiles').update(input.update).eq('id', input.id)
      if (error) throw error
    },
  })
}
