'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react'
import { Save, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComponentPreviewProps {
  code: string
  onSave?: (code: string) => void
  readOnly?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
}

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export function ComponentPreview({
  code,
  onSave,
  readOnly = false,
}: ComponentPreviewProps) {
  const [editedCode, setEditedCode] = useState(code)
  const [showEditor, setShowEditor] = useState(true)

  // Sync when code prop changes externally
  const prevCodeRef = useRef(code)
  if (code !== prevCodeRef.current) {
    prevCodeRef.current = code
    setEditedCode(code)
  }

  const handleSave = useCallback(() => {
    onSave?.(editedCode)
  }, [editedCode, onSave])

  if (!code) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Generate a component to see preview
      </div>
    )
  }

  const files = {
    '/App.tsx': editedCode,
  }

  return (
    <PreviewErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center bg-destructive/10 p-4 text-sm text-destructive">
          Component preview failed to render. Check for syntax errors.
        </div>
      }
    >
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditor((v) => !v)}
          >
            <Code2 className="size-4" />
            {showEditor ? 'Hide Code' : 'Show Code'}
          </Button>
          {!readOnly && onSave && (
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="size-4" />
              Save Changes
            </Button>
          )}
        </div>

        {/* Sandpack */}
        <div className="flex-1 overflow-hidden">
          <SandpackProvider
            template="react-ts"
            files={files}
            options={{
              activeFile: '/App.tsx',
              visibleFiles: ['/App.tsx'],
            }}
          >
            <div
              className={cn(
                'flex h-full',
                showEditor ? 'flex-row' : 'flex-col'
              )}
            >
              {showEditor && (
                <div className="h-full w-1/2 overflow-auto border-r">
                  <SandpackCodeEditor
                    showLineNumbers
                    showTabs={false}
                    readOnly={readOnly}
                    style={{ height: '100%' }}
                  />
                </div>
              )}
              <div className={cn('h-full', showEditor ? 'w-1/2' : 'w-full')}>
                <SandpackPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton
                  style={{ height: '100%' }}
                />
              </div>
            </div>
          </SandpackProvider>
        </div>
      </div>
    </PreviewErrorBoundary>
  )
}
