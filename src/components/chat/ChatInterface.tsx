'use client'

import { useEffect, useRef } from 'react'
import { Bot, User, Sparkles, Search, Mail, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/ChatInput'
import type { Message } from '@/hooks/useChat'

interface ChatInterfaceProps {
  messages: Message[]
  streaming: boolean
  onSendMessage: (content: string) => void
}

const suggestions = [
  { icon: Search, label: 'Help me find leads', prompt: 'Help me find leads for my product' },
  { icon: Mail, label: 'Draft an outreach email', prompt: 'Draft a cold outreach email for a potential customer' },
  { icon: Target, label: 'Analyze my ICP', prompt: 'Analyze my ideal customer profile and suggest improvements' },
]

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (triple backtick)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre class="my-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-sm text-slate-100"><code>$2</code></pre>'
  )

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-slate-200 px-1.5 py-0.5 text-sm font-mono">$1</code>'
  )

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

  // Line breaks
  html = html.replace(/\n/g, '<br />')

  return html
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
        <Bot className="h-4 w-4 text-slate-600" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export function ChatInterface({ messages, streaming, onSendMessage }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              Start a conversation
            </h2>
            <p className="mb-8 max-w-md text-center text-sm text-slate-500">
              Ask me anything about sales strategy, lead generation, outreach, or
              go-to-market planning.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={suggestion.label}
                    onClick={() => onSendMessage(suggestion.prompt)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Icon className="h-4 w-4" />
                    {suggestion.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'mb-4 flex items-start gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    message.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-slate-200'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-slate-600" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={cn(
                    'max-w-[80%] space-y-1',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'rounded-tr-sm bg-blue-600 text-white'
                        : 'rounded-tl-sm bg-slate-100 text-slate-800'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div
                        className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(message.content),
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  <p
                    className={cn(
                      'px-1 text-xs text-slate-400',
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatTimestamp(message.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator during streaming when last message has no content yet */}
            {streaming &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'assistant' &&
              messages[messages.length - 1].content === '' && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={onSendMessage} disabled={streaming} />
        </div>
      </div>
    </div>
  )
}
