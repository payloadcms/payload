import type { LanguageModel } from 'ai'

import { openai } from '@ai-sdk/openai'

/**
 * Named model presets. (Add new providers here)
 */
export const MODELS = {
  'openai:gpt-5.2': openai('gpt-5.2'),
  'openai:gpt-4o-mini': openai('gpt-4o-mini'),
  'openai:gpt-4o': openai('gpt-4o'),
} satisfies Record<string, LanguageModel>

export const DEFAULT_RUNNER_MODEL: LanguageModel = MODELS['openai:gpt-5.2']
export const DEFAULT_SCORER_MODEL: LanguageModel = MODELS['openai:gpt-4o-mini']
