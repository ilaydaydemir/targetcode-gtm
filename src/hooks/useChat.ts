'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'

type Conversation = Tables<'conversations'>
type ChatMessage = Tables<'chat_messages'>

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load conversations on mount (chat type only)
  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('type', 'chat')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setConversations(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Select a conversation and load its messages
  const selectConversation = useCallback(
    async (id: string) => {
      const conversation = conversations.find((c) => c.id === id) || null
      setCurrentConversation(conversation)

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(
          data.map((msg: ChatMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
          }))
        )
      }
    },
    [supabase, conversations]
  )

  // Create a new conversation
  const createConversation = useCallback(async () => {
    setCurrentConversation(null)
    setMessages([])
  }, [])

  // Delete a conversation
  const deleteConversation = useCallback(
    async (id: string) => {
      // Delete messages first, then conversation
      await supabase.from('chat_messages').delete().eq('conversation_id', id)
      await supabase.from('conversations').delete().eq('id', id)

      setConversations((prev) => prev.filter((c) => c.id !== id))

      if (currentConversation?.id === id) {
        setCurrentConversation(null)
        setMessages([])
      }
    },
    [supabase, currentConversation]
  )

  // Send a message and stream the response
  const sendMessage = useCallback(
    async (content: string) => {
      if (streaming) return

      // Optimistically add user message to the UI
      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Prepare assistant message placeholder
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setStreaming(true)

      try {
        abortControllerRef.current = new AbortController()

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversationId: currentConversation?.id,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedContent = ''
        let resolvedConversationId: string | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE lines
          const lines = buffer.split('\n')
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine.startsWith('data: ')) continue

            const jsonStr = trimmedLine.slice(6)
            try {
              const data = JSON.parse(jsonStr)

              if (data.content) {
                accumulatedContent += data.content
                setMessages((prev) => {
                  const updated = [...prev]
                  const lastMsg = updated[updated.length - 1]
                  if (lastMsg && lastMsg.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      content: accumulatedContent,
                    }
                  }
                  return updated
                })
              }

              if (data.done && data.conversationId) {
                resolvedConversationId = data.conversationId
              }

              if (data.error) {
                console.error('Stream error:', data.error)
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // After streaming completes, refresh conversations list
        // and set the current conversation if it was newly created
        if (resolvedConversationId) {
          const { data: updatedConversations } = await supabase
            .from('conversations')
            .select('*')
            .eq('type', 'chat')
            .order('updated_at', { ascending: false })

          if (updatedConversations) {
            setConversations(updatedConversations)
            const conv = updatedConversations.find(
              (c) => c.id === resolvedConversationId
            )
            if (conv) {
              setCurrentConversation(conv)
            }
          }

          // Reload messages from DB to get real IDs
          const { data: dbMessages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', resolvedConversationId)
            .order('created_at', { ascending: true })

          if (dbMessages) {
            setMessages(
              dbMessages.map((msg: ChatMessage) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                created_at: msg.created_at,
              }))
            )
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Send message error:', err)
        // Remove the failed assistant message placeholder
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id))
      } finally {
        setStreaming(false)
        abortControllerRef.current = null
      }
    },
    [streaming, currentConversation, supabase]
  )

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    streaming,
    sendMessage,
    selectConversation,
    createConversation,
    deleteConversation,
  }
}
