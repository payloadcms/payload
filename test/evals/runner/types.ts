import type { LanguageModel } from 'ai'

import type { CodegenRunnerResult, SystemPromptKey } from '../types.js'

export type RunnerKind = 'claude-code' | 'llm'
export type RunnerCapability = 'mcp'

export const RUNNER_CAPABILITIES: Record<RunnerKind, RunnerCapability[]> = {
  'claude-code': ['mcp'],
  llm: [],
}

export type SkillInstallMode = 'embedded' | 'none'

/**
 * Options for a codegen runner. `kind` selects which runner consumes the bag;
 * fields tagged "claude-code only" or "llm only" are ignored by the other runner.
 */
export type CodegenRunnerOptions = {
  /** claude-code only: model string passed to the `claude --model` flag. */
  agentModel?: string
  /** Starter config fixture path. */
  configPath?: string
  /** Expose the starter config's Payload MCP tools to the runner. */
  exposeMcpTools?: boolean
  kind?: RunnerKind
  /** llm only: AI SDK `LanguageModel` instance. */
  model?: LanguageModel
  /** claude-code only: how the Payload skill is installed in the workdir. */
  skillInstall?: SkillInstallMode
  /** llm only: which system prompt variant to use. */
  systemPromptKey?: SystemPromptKey
  /** claude-code only: hard timeout before the agent process is killed. */
  timeoutMs?: number
}

export type CodegenRunner = {
  run: (
    instruction: string,
    starterConfig: string,
    opts: CodegenRunnerOptions,
  ) => Promise<CodegenRunnerResult>
}
