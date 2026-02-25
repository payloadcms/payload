import type { LanguageModel } from 'ai'

import type { SystemPromptKey } from '../types.js'

export type SuiteOptions = {
  labelSuffix?: string
  runnerModel?: LanguageModel
  systemPromptKey?: SystemPromptKey
}
