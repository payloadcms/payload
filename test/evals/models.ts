import type { LanguageModel } from 'ai'

import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'

/**
 * Named model presets. (Add new providers here)
 */
export const MODELS = {
  'anthropic:claude-haiku-4-5': anthropic('claude-haiku-4-5-20251001'),
  'anthropic:claude-opus-4-8': anthropic('claude-opus-4-8'),
  'anthropic:claude-sonnet-4-6': anthropic('claude-sonnet-4-6'),
  'openai:gpt-4o-mini': openai('gpt-4o-mini'),
  'openai:gpt-5.2': openai('gpt-5.2'),
} satisfies Record<string, LanguageModel>

// Default to OpenAI when its key is present,
// otherwise fall back to Anthropic so the suite runs on either key.
const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY)

export const DEFAULT_RUNNER_MODEL: LanguageModel = hasOpenAIKey
  ? MODELS['openai:gpt-5.2']
  : MODELS['anthropic:claude-sonnet-4-6']
export const DEFAULT_SCORER_MODEL: LanguageModel = hasOpenAIKey
  ? MODELS['openai:gpt-4o-mini']
  : MODELS['anthropic:claude-haiku-4-5']
