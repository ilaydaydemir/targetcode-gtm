'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ComponentPreview } from '@/components/vibe/ComponentPreview'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface VibeChatProps {
  onCodeGenerated?: (code: string) => void
  initialCode?: string
  initialConversationId?: string
}

export function VibeChat({
  onCodeGenerated,
  initialCode,
  initialConversationId,
}: VibeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(
    initialCode || null
  )
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  )
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [saveType, setSaveType] = useState<'widget' | 'page' | 'workflow_step'>(
    'widget'
  )
  const [onSaveCallback, setOnSaveCallback] = useState<
    ((component: {
      name: string
      description: string
      type: 'widget' | 'page' | 'workflow_step'
      code: string
    }) => Promise<unknown>) | null
  >(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/vibe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          conversationId,
          existingCode: generatedCode || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate component')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      if (data.code) {
        setGeneratedCode(data.code)
        onCodeGenerated?.(data.code)
      }
    } catch (err) {
      console.error('Vibe chat error:', err)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong generating the component. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSaveClick = (
    saveCallback: (component: {
      name: string
      description: string
      type: 'widget' | 'page' | 'workflow_step'
      code: string
    }) => Promise<unknown>
  ) => {
    setOnSaveCallback(() => saveCallback)
    setSaveDialogOpen(true)
  }

  const handleSaveConfirm = async () => {
    if (!saveName.trim() || !generatedCode || !onSaveCallback) return

    await onSaveCallback({
      name: saveName.trim(),
      description: saveDescription.trim(),
      type: saveType,
      code: generatedCode,
    })

    setSaveDialogOpen(false)
    setSaveName('')
    setSaveDescription('')
    setSaveType('widget')
    setOnSaveCallback(null)
  }

  const handleCodeChange = (code: string) => {
    setGeneratedCode(code)
    onCodeGenerated?.(code)
  }

  return (
    <div className="flex h-full gap-4">
      {/* Chat panel */}
      <div className="flex w-1/2 flex-col rounded-lg border bg-background">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Describe the component you want to create
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'ml-8 bg-primary text-primary-foreground'
                    : 'mr-8 bg-muted text-foreground'
                )}
              >
                <p className="mb-1 text-xs font-medium opacity-70">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </p>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Generating component...
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your component..."
              disabled={loading}
              className="min-h-10 resize-none"
              rows={2}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              size="icon"
              className="shrink-0 self-end"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div className="flex w-1/2 flex-col gap-2">
        {generatedCode && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleSaveClick(async (component) => {
                  // Parent component should wire this up with useCustomComponents
                  onCodeGenerated?.(component.code)
                })
              }
            >
              <Save className="size-4" />
              Save Component
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-hidden rounded-lg border">
          <ComponentPreview
            code={generatedCode || ''}
            onSave={handleCodeChange}
          />
        </div>
      </div>

      {/* Save dialog */}
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
              <Label htmlFor="component-name">Name</Label>
              <Input
                id="component-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="My Component"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-description">Description</Label>
              <Input
                id="component-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="A brief description..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-type">Type</Label>
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
