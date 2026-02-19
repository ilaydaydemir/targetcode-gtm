'use client'

import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/types'

type Conversation = Tables<'conversations'>

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header with new conversation button */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
        <Button
          onClick={onCreate}
          variant="ghost"
          size="icon-sm"
          className="text-slate-500 hover:text-slate-900"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">No conversations</p>
            <p className="mt-1 text-xs text-slate-400">
              Start a new conversation to get going
            </p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeId

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    'group relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <MessageSquare
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {conversation.title}
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 text-xs',
                        isActive ? 'text-blue-600/70' : 'text-slate-400'
                      )}
                    >
                      {formatDate(conversation.updated_at)}
                    </p>
                  </div>

                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(conversation.id)
                    }}
                    className="absolute right-2 top-2.5 hidden rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
