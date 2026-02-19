'use client'

import { useState } from 'react'
import { MessageSquare, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ConversationList } from '@/components/chat/ConversationList'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    streaming,
    sendMessage,
    selectConversation,
    createConversation,
    deleteConversation,
  } = useChat()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] bg-white">
      {/* Mobile sidebar toggle */}
      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        variant="ghost"
        size="icon"
        className="fixed left-18 top-[4.5rem] z-30 md:hidden"
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeft className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar - Conversation list */}
      <div
        className={cn(
          'h-full border-r border-slate-200 bg-white transition-all duration-300',
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
          // On mobile, overlay the sidebar
          'max-md:fixed max-md:left-0 max-md:top-16 max-md:z-20 max-md:h-[calc(100vh-4rem)] max-md:shadow-lg',
          !sidebarOpen && 'max-md:invisible'
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={currentConversation?.id ?? null}
          onSelect={(id) => {
            selectConversation(id)
            // Close sidebar on mobile after selecting
            if (window.innerWidth < 768) {
              setSidebarOpen(false)
            }
          }}
          onCreate={createConversation}
          onDelete={deleteConversation}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="icon-sm"
            className="hidden md:flex"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <MessageSquare className="h-5 w-5 text-slate-600" />
          <h1 className="text-sm font-semibold text-slate-900">
            {currentConversation?.title ?? 'New Conversation'}
          </h1>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            streaming={streaming}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  )
}
