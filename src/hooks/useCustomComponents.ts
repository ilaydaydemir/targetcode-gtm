'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables, Json } from '@/lib/supabase/types'

type CustomComponent = Tables<'custom_components'>

export function useCustomComponents() {
  const [components, setComponents] = useState<CustomComponent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadComponents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('custom_components')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setComponents(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadComponents()
  }, [loadComponents])

  const saveComponent = useCallback(
    async (component: {
      name: string
      description: string
      type: 'widget' | 'page' | 'workflow_step'
      code: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data, error } = await supabase
        .from('custom_components')
        .insert({
          user_id: user.id,
          name: component.name,
          description: component.description,
          type: component.type,
          code: component.code,
        })
        .select()
        .single()

      if (!error && data) {
        setComponents((prev) => [data, ...prev])
        return data
      }

      return null
    },
    [supabase]
  )

  const updateComponent = useCallback(
    async (
      id: string,
      updates: { code?: string; config?: Json }
    ) => {
      // Fetch current version to increment
      const current = components.find((c) => c.id === id)
      const nextVersion = current ? current.version + 1 : 1

      const { data, error } = await supabase
        .from('custom_components')
        .update({
          ...updates,
          version: nextVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        setComponents((prev) =>
          prev.map((c) => (c.id === id ? data : c))
        )
        return data
      }

      return null
    },
    [supabase, components]
  )

  const deleteComponent = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('custom_components')
        .delete()
        .eq('id', id)

      if (!error) {
        setComponents((prev) => prev.filter((c) => c.id !== id))
      }
    },
    [supabase]
  )

  const loadComponent = useCallback(
    async (id: string) => {
      const { data, error } = await supabase
        .from('custom_components')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        return data
      }

      return null
    },
    [supabase]
  )

  return {
    components,
    loading,
    saveComponent,
    updateComponent,
    deleteComponent,
    loadComponent,
  }
}
