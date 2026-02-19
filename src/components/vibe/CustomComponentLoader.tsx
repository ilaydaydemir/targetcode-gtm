'use client'

import { useState, useEffect } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ComponentPreview } from '@/components/vibe/ComponentPreview'
import type { Tables } from '@/lib/supabase/types'

type CustomComponent = Tables<'custom_components'>

interface CustomComponentLoaderProps {
  componentId: string
  onEdit?: (component: CustomComponent) => void
}

export function CustomComponentLoader({
  componentId,
  onEdit,
}: CustomComponentLoaderProps) {
  const [component, setComponent] = useState<CustomComponent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchComponent() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('custom_components')
        .select('*')
        .eq('id', componentId)
        .single()

      if (fetchError || !data) {
        setError('Failed to load component')
        setComponent(null)
      } else {
        setComponent(data)
      }

      setLoading(false)
    }

    fetchComponent()
  }, [componentId, supabase])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !component) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {error || 'Component not found'}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Component info header */}
      <div className="flex items-start justify-between rounded-lg border bg-background p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{component.name}</h3>
            <Badge variant="secondary">{component.type}</Badge>
            <span className="text-xs text-muted-foreground">
              v{component.version}
            </span>
          </div>
          {component.description && (
            <p className="text-sm text-muted-foreground">
              {component.description}
            </p>
          )}
        </div>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(component)}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Preview (read-only) */}
      <div className="flex-1 overflow-hidden rounded-lg border">
        <ComponentPreview code={component.code} readOnly />
      </div>
    </div>
  )
}
