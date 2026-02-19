'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  Pencil,
  Eye,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCustomComponents } from '@/hooks/useCustomComponents'
import { VibeChat } from '@/components/vibe/VibeChat'
import { ComponentPreview } from '@/components/vibe/ComponentPreview'
import type { Tables } from '@/lib/supabase/types'

type CustomComponent = Tables<'custom_components'>

type View = 'gallery' | 'builder'

export default function CustomComponentsPage() {
  const {
    components,
    loading,
    saveComponent,
    updateComponent,
    deleteComponent,
  } = useCustomComponents()

  const [view, setView] = useState<View>('gallery')
  const [previewComponent, setPreviewComponent] = useState<CustomComponent | null>(null)
  const [editingComponent, setEditingComponent] = useState<CustomComponent | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Save dialog state for builder
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [saveType, setSaveType] = useState<'widget' | 'page' | 'workflow_step'>('widget')

  const handleCreateNew = () => {
    setEditingComponent(null)
    setGeneratedCode(null)
    setView('builder')
  }

  const handleEditComponent = (component: CustomComponent) => {
    setEditingComponent(component)
    setGeneratedCode(component.code)
    setView('builder')
  }

  const handlePreview = (component: CustomComponent) => {
    setPreviewComponent(component)
  }

  const handleDelete = async (id: string) => {
    await deleteComponent(id)
    setDeleteConfirmId(null)
    if (previewComponent?.id === id) {
      setPreviewComponent(null)
    }
  }

  const handleBackToGallery = () => {
    setView('gallery')
    setEditingComponent(null)
    setGeneratedCode(null)
    setPreviewComponent(null)
  }

  const handleCodeGenerated = (code: string) => {
    setGeneratedCode(code)
  }

  const handleSaveFromBuilder = () => {
    if (!generatedCode) return

    if (editingComponent) {
      // Update existing component
      updateComponent(editingComponent.id, { code: generatedCode })
    } else {
      // Open save dialog for new component
      setSaveDialogOpen(true)
    }
  }

  const handleSaveConfirm = async () => {
    if (!saveName.trim() || !generatedCode) return

    const saved = await saveComponent({
      name: saveName.trim(),
      description: saveDescription.trim(),
      type: saveType,
      code: generatedCode,
    })

    if (saved) {
      setSaveDialogOpen(false)
      setSaveName('')
      setSaveDescription('')
      setSaveType('widget')
      setEditingComponent(saved)
    }
  }

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case 'widget':
        return 'default' as const
      case 'page':
        return 'secondary' as const
      case 'workflow_step':
        return 'outline' as const
      default:
        return 'default' as const
    }
  }

  // Gallery view
  if (view === 'gallery') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Custom Components</h2>
            <p className="text-sm text-muted-foreground">
              Build and manage your custom React components with AI
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="size-4" />
            Create New Component
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && components.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-sm text-muted-foreground">
                No custom components yet. Create your first one with AI.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="size-4" />
                Create Component
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Component grid */}
        {!loading && components.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {components.map((component) => (
              <Card key={component.id} className="group relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {component.name}
                      </CardTitle>
                      {component.description && (
                        <CardDescription>
                          {component.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={typeBadgeVariant(component.type)}>
                        {component.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      v{component.version}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handlePreview(component)}
                      >
                        <Eye className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleEditComponent(component)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteConfirmId(component.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview dialog */}
        {previewComponent && (
          <Dialog
            open={!!previewComponent}
            onOpenChange={(open) => {
              if (!open) setPreviewComponent(null)
            }}
          >
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {previewComponent.name}
                  <Badge variant={typeBadgeVariant(previewComponent.type)}>
                    {previewComponent.type}
                  </Badge>
                  <span className="text-xs font-normal text-muted-foreground">
                    v{previewComponent.version}
                  </span>
                </DialogTitle>
                {previewComponent.description && (
                  <DialogDescription>
                    {previewComponent.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="flex-1 overflow-hidden rounded-lg border">
                <ComponentPreview code={previewComponent.code} readOnly />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleEditComponent(previewComponent)
                    setPreviewComponent(null)
                  }}
                >
                  <Pencil className="size-4" />
                  Edit in Builder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete confirmation dialog */}
        <Dialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirmId(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Component</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this component? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Builder view
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Builder header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToGallery}>
            <ArrowLeft className="size-4" />
            Back to Gallery
          </Button>
          <h2 className="text-lg font-semibold">
            {editingComponent
              ? `Editing: ${editingComponent.name}`
              : 'New Component'}
          </h2>
          {editingComponent && (
            <Badge variant={typeBadgeVariant(editingComponent.type)}>
              {editingComponent.type}
            </Badge>
          )}
        </div>
        {generatedCode && (
          <Button onClick={handleSaveFromBuilder}>
            {editingComponent ? 'Update Component' : 'Save Component'}
          </Button>
        )}
      </div>

      {/* VibeChat + Preview */}
      <div className="flex-1 overflow-hidden">
        <VibeChat
          onCodeGenerated={handleCodeGenerated}
          initialCode={editingComponent?.code}
        />
      </div>

      {/* Save dialog for new components */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Component</DialogTitle>
            <DialogDescription>
              Give your component a name and description to save it to your
              library.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="save-name">Name</Label>
              <Input
                id="save-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="My Component"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-description">Description</Label>
              <Input
                id="save-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="A brief description..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-type">Type</Label>
              <Select
                value={saveType}
                onValueChange={(v) =>
                  setSaveType(v as 'widget' | 'page' | 'workflow_step')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="widget">Widget</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="workflow_step">Workflow Step</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={!saveName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
