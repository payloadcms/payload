import type { LanguageModel } from 'ai'

import type { CodegenRunnerResult, SystemPromptKey } from '../types.js'

export type RunnerKind = 'llm'

export type CodegenRunnerOptions = {
  kind?: RunnerKind
  model?: LanguageModel
  systemPromptKey?: SystemPromptKey
}

export type CodegenRunner = {
  run: (
    instruction: string,
    starterConfig: string,
    opts: CodegenRunnerOptions,
  ) => Promise<CodegenRunnerResult>
}
