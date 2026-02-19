import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS } from '@/lib/claude'

const SYSTEM_PROMPT = `You are a React component generator. Generate clean, working React components using Tailwind CSS. Return ONLY the component code wrapped in \`\`\`tsx code blocks. The component should be a default export. Use only built-in React hooks and Tailwind classes. Do not import external libraries.`

function extractCode(text: string): string | null {
  const match = text.match(/```tsx\s*\n([\s\S]*?)```/)
  return match ? match[1].trim() : null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, conversationId: existingConversationId, existingCode } = body as {
      prompt: string
      conversationId?: string
      existingCode?: string
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Resolve or create conversation
    let conversationId = existingConversationId

    if (!conversationId) {
      const title = prompt.slice(0, 80) + (prompt.length > 80 ? '...' : '')
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          type: 'vibe' as const,
        })
        .select('id')
        .single()

      if (convError || !newConversation) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }

      conversationId = newConversation.id
    }

    // Save user message
    const { error: msgError } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: 'user' as const,
      content: prompt.trim(),
    })

    if (msgError) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Build messages array with conversation history
    const { data: historyMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    const claudeMessages = (historyMessages || []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // If existing code is provided, prepend context to the last user message
    if (existingCode && claudeMessages.length > 0) {
      const lastMsg = claudeMessages[claudeMessages.length - 1]
      if (lastMsg.role === 'user') {
        lastMsg.content = `Here is the existing component code to modify:\n\n\`\`\`tsx\n${existingCode}\n\`\`\`\n\n${lastMsg.content}`
      }
    }

    // Call Claude API (non-streaming to extract code)
    const response = await anthropic.messages.create({
      model: MODELS.vibe,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    })

    // Extract full text response
    const fullResponse = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Extract code from response
    const extractedCode = extractCode(fullResponse)

    // Save assistant message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: 'assistant' as const,
      content: fullResponse,
    })

    return NextResponse.json({
      code: extractedCode,
      message: fullResponse,
      conversationId,
    })
  } catch (err) {
    console.error('Vibe generate API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
