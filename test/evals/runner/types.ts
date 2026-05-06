import type { LanguageModel } from 'ai'

import type { CodegenRunnerResult, SystemPromptKey } from '../types.js'

export type RunnerKind = 'claude-code' | 'llm'

export type SkillInstallMode = 'embedded' | 'none'

export type CodegenRunnerOptions = {
  agentModel?: string
  kind?: RunnerKind
  model?: LanguageModel
  skillInstall?: SkillInstallMode
  systemPromptKey?: SystemPromptKey
  timeoutMs?: number
}

export type CodegenRunner = {
  run: (
    instruction: string,
    starterConfig: string,
    opts: CodegenRunnerOptions,
  ) => Promise<CodegenRunnerResult>
}
