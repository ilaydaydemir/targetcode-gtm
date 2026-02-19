import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS } from '@/lib/claude'

function buildSystemPrompt(prefs: Record<string, unknown>): string {
  const companyName = (prefs.company_name as string) || 'your company'
  const companyDescription = prefs.company_description as string | null
  const productDescription = prefs.product_service_description as string | null
  const uniqueValue = prefs.unique_value_proposition as string | null
  const pricingModel = prefs.pricing_model as string | null
  const industry = prefs.industry as string | null
  const targetMarket = prefs.target_market as string | null
  const companySize = prefs.company_size as string | null
  const headquarters = prefs.headquarters_location as string | null

  const icpJobTitles = prefs.icp_job_titles as string[] | null
  const icpIndustries = prefs.icp_industries as string[] | null
  const icpCompanySizes = prefs.icp_company_sizes as string[] | null
  const icpRegions = prefs.icp_geographic_regions as string[] | null
  const icpPainPoints = prefs.icp_pain_points as string | null
  const icpGoals = prefs.icp_goals as string | null
  const icpBudgetRange = prefs.icp_budget_range as string | null

  const salesCycleLength = prefs.sales_cycle_length as string | null
  const mainCompetitors = prefs.main_competitors as string | null
  const keyDifferentiators = prefs.key_differentiators as string | null
  const preferredTone = (prefs.preferred_tone as string) || 'professional'
  const customInstructions = prefs.custom_instructions as string | null

  const sections: string[] = []

  sections.push(`You are an AI sales and GTM (Go-To-Market) assistant for ${companyName}.`)

  if (companyDescription) {
    sections.push(`\nCompany Overview: ${companyDescription}`)
  }
  if (industry) {
    sections.push(`Industry: ${industry}`)
  }
  if (targetMarket) {
    sections.push(`Target Market: ${targetMarket}`)
  }
  if (companySize) {
    sections.push(`Company Size: ${companySize}`)
  }
  if (headquarters) {
    sections.push(`Headquarters: ${headquarters}`)
  }

  if (productDescription || uniqueValue || pricingModel) {
    sections.push('\n--- Product/Service ---')
    if (productDescription) sections.push(`Description: ${productDescription}`)
    if (uniqueValue) sections.push(`Unique Value Proposition: ${uniqueValue}`)
    if (pricingModel) sections.push(`Pricing Model: ${pricingModel}`)
  }

  const hasIcp =
    (icpJobTitles && icpJobTitles.length > 0) ||
    (icpIndustries && icpIndustries.length > 0) ||
    (icpCompanySizes && icpCompanySizes.length > 0) ||
    (icpRegions && icpRegions.length > 0) ||
    icpPainPoints ||
    icpGoals ||
    icpBudgetRange

  if (hasIcp) {
    sections.push('\n--- Ideal Customer Profile (ICP) ---')
    if (icpJobTitles && icpJobTitles.length > 0) {
      sections.push(`Target Job Titles: ${icpJobTitles.join(', ')}`)
    }
    if (icpIndustries && icpIndustries.length > 0) {
      sections.push(`Target Industries: ${icpIndustries.join(', ')}`)
    }
    if (icpCompanySizes && icpCompanySizes.length > 0) {
      sections.push(`Target Company Sizes: ${icpCompanySizes.join(', ')}`)
    }
    if (icpRegions && icpRegions.length > 0) {
      sections.push(`Geographic Regions: ${icpRegions.join(', ')}`)
    }
    if (icpPainPoints) sections.push(`Pain Points: ${icpPainPoints}`)
    if (icpGoals) sections.push(`Goals: ${icpGoals}`)
    if (icpBudgetRange) sections.push(`Budget Range: ${icpBudgetRange}`)
  }

  if (salesCycleLength || mainCompetitors || keyDifferentiators) {
    sections.push('\n--- Sales Context ---')
    if (salesCycleLength) sections.push(`Sales Cycle Length: ${salesCycleLength}`)
    if (mainCompetitors) sections.push(`Main Competitors: ${mainCompetitors}`)
    if (keyDifferentiators) sections.push(`Key Differentiators: ${keyDifferentiators}`)
  }

  sections.push(`\nPreferred Tone: ${preferredTone}`)

  if (customInstructions) {
    sections.push(`\nCustom Instructions: ${customInstructions}`)
  }

  sections.push(
    '\nHelp the user with lead generation, outreach, sales strategy, campaign planning, and go-to-market execution. Provide actionable, specific advice grounded in the company context above.'
  )

  return sections.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { message, conversationId: existingConversationId } = body as {
      message: string
      conversationId?: string
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Resolve or create conversation
    let conversationId = existingConversationId

    if (!conversationId) {
      const title = message.slice(0, 80) + (message.length > 80 ? '...' : '')
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          type: 'chat' as const,
        })
        .select('id')
        .single()

      if (convError || !newConversation) {
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      conversationId = newConversation.id
    }

    // Save user message
    const { error: msgError } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: 'user' as const,
      content: message.trim(),
    })

    if (msgError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Load user preferences for system prompt context
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const systemPrompt = preferences
      ? buildSystemPrompt(preferences as unknown as Record<string, unknown>)
      : `You are an AI sales and GTM assistant. Help the user with lead generation, outreach, sales strategy, campaign planning, and go-to-market execution.`

    // Load last 20 messages from this conversation for context
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

    // Stream response using Claude API
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    const streamResponse = async () => {
      let fullContent = ''

      try {
        const stream = anthropic.messages.stream({
          model: MODELS.chat,
          max_tokens: 4096,
          system: systemPrompt,
          messages: claudeMessages,
        })

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const text = event.delta.text
            fullContent += text
            const chunk = `data: ${JSON.stringify({ content: text })}\n\n`
            await writer.write(encoder.encode(chunk))
          }
        }

        // Save full assistant message to database
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'assistant' as const,
          content: fullContent,
        })

        // Send final event
        const doneChunk = `data: ${JSON.stringify({ done: true, conversationId })}\n\n`
        await writer.write(encoder.encode(doneChunk))
      } catch (err) {
        const errorChunk = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`
        await writer.write(encoder.encode(errorChunk))
        console.error('Chat stream error:', err)
      } finally {
        await writer.close()
      }
    }

    // Start streaming in the background (not awaited)
    streamResponse()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
