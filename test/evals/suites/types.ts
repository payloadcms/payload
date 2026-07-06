import type { LanguageModel } from 'ai'

import type { RunnerCapability, RunnerKind, SkillInstallMode } from '../runner/types.js'
import type { SystemPromptKey } from '../types.js'

export type SuiteOptions = {
  agentModel?: string
  capabilities?: RunnerCapability[]
  kind?: RunnerKind
  labelSuffix?: string
  runnerModel?: LanguageModel
  skillInstall?: SkillInstallMode
  systemPromptKey?: SystemPromptKey
}
