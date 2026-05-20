import type { LanguageModel } from 'ai'

import type { RunnerKind, SkillInstallMode } from '../runner/types.js'
import type { SystemPromptKey } from '../types.js'

export type SuiteOptions = {
  agentModel?: string
  kind?: RunnerKind
  labelSuffix?: string
  runnerModel?: LanguageModel
  skillInstall?: SkillInstallMode
  systemPromptKey?: SystemPromptKey
}
