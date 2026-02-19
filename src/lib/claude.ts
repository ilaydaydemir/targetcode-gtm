import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODELS = {
  chat: 'claude-sonnet-4-5-20250929',
  vibe: 'claude-sonnet-4-5-20250929',
} as const
