import type { LanguageModel } from 'ai'

import type { CodegenRunnerResult, SystemPromptKey } from '../types.js'

export type RunnerKind = 'claude-code' | 'llm'
export type RunnerCapability = 'mcp'

export const RUNNER_CAPABILITIES: Record<RunnerKind, RunnerCapability[]> = {
  'claude-code': ['mcp'],
  llm: [],
}

export type SkillInstallMode = 'embedded' | 'none'

export type AgentBuiltinTool = 'Bash' | 'Read'

export type AgentWorkspaceFile = {
  /** File on the host that will be copied into the agent's workdir. */
  sourcePath: string
  /** Relative path where the agent will see the file. */
  targetPath: string
}

/**
 * Options for a codegen runner. `kind` selects which runner consumes the bag;
 * fields tagged "claude-code only" or "llm only" are ignored by the other runner.
 */
export type CodegenRunnerOptions = {
  /** claude-code only: extra built-in tools available for this case. */
  additionalAllowedTools?: AgentBuiltinTool[]
  /** claude-code only: model string passed to the `claude --model` flag. */
  agentModel?: string
  /** Starter config fixture path. */
  configPath?: string
  /** Expose the starter config's Payload MCP tools to the runner. */
  exposeMcpTools?: boolean
  kind?: RunnerKind
  /** claude-code only: frozen config used by this case's parent and MCP process. */
  mcpConfigPath?: string
  /** claude-code only: database shared by this case's setup and MCP process. */
  mcpDatabaseURL?: string
  /** llm only: AI SDK `LanguageModel` instance. */
  model?: LanguageModel
  /** claude-code only: how the Payload skill is installed in the workdir. */
  skillInstall?: SkillInstallMode
  /** llm only: which system prompt variant to use. */
  systemPromptKey?: SystemPromptKey
  /** claude-code only: hard timeout before the agent process is killed. */
  timeoutMs?: number
  /** claude-code only: files copied into the temporary agent workdir. */
  workspaceFiles?: AgentWorkspaceFile[]
}

export type CodegenRunner = {
  run: (
    instruction: string,
    starterConfig: string,
    opts: CodegenRunnerOptions,
  ) => Promise<CodegenRunnerResult>
}
