import type { LanguageModel } from 'ai'
import type { Payload } from 'payload'
import type { ExpectStatic } from 'vitest'

import type { ParsedConfig } from './assertions/parseConfig.js'
import type { EvalConfig } from './evalConfig.js'
import type { RunnerKind, SkillInstallMode } from './runner/types.js'

// Dataset
export type EvalCategory =
  | 'coding'
  | 'collections'
  | 'commits'
  | 'config'
  | 'development'
  | 'fields'
  | 'graphql'
  | 'local-api'
  | 'mcp'
  | 'negative'
  | 'plugins'
  | 'rest-api'
  | 'structure'
  | 'testing'

export type EvalCase = {
  /** Boot the starter config before the agent runs. */
  bootConfig?: boolean
  category: EvalCategory
  /**
   * Folder under `test/evals/fixtures/` that contains the `payload.config.ts`
   * for this case.
   *
   * Eval cases read it as the starter config the model edits. Runtime cases
   * boot the generated config after TypeScript passes.
   */
  configPath: string
  /** Task prompt given to the model. */
  input: string
  /**
   * Checks the generated config after TypeScript passes.
   *
   * Use `config` for deterministic checks against the imported generated
   * config, `ast` for source-level checks, `payload.*` when the generated
   * config must boot and write/read real data, and `return score(...)` when
   * the LLM scorer should judge the result.
   */
  verify: (args: EvalVerifyContext) => EvalVerifyResult | Promise<EvalVerifyResult>
}

export type EvalExpect = ExpectStatic

export type EvalScore = (
  expected: string,
  evidence?: unknown,
) => ConfigChangeScorerResult | Promise<ConfigChangeScorerResult>

export type EvalVerifyContext = {
  /** Source-level AST summary from the existing TypeScript parser. */
  ast: ParsedConfig
  /** Imported generated config, normalized for easy eval assertions. */
  config: EvalConfig
  expect: EvalExpect
  /**
   * Lazy Payload Local API for the generated config. The eval only boots Payload
   * if this object is actually used.
   */
  payload: Payload
  /**
   * Runs the LLM scorer. Return this from `verify` when the scorer should decide
   * the final score, optionally with runtime evidence to score instead of a pure
   * config diff.
   */
  score: EvalScore
  /** Complete generated `payload.config.ts` source. */
  source: string
}

export type EvalVerifyResult = ConfigChangeScorerResult | void

// Models
export type ModelKey = 'openai:gpt-4o-mini' | 'openai:gpt-5.2'

// Usage
export type TokenUsage = {
  /** Tokens read from the prompt cache (billed at reduced rate). Key signal for skill efficiency. */
  cachedInputTokens: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
}
export type EvalUsage = {
  /** Tokens used by the LLM runner (answer generation or codegen) */
  runner: TokenUsage
  /** Tokens used by the LLM scorer */
  scorer?: TokenUsage
  /** Convenience sum of runner + scorer */
  total: TokenUsage
}

// Runner
export type SystemPromptKey = 'codegenNoSkill' | 'codegenWithSkill'
export type TranscriptEvent =
  | { content: string; isError?: boolean; toolUseId: string; type: 'tool_result' }
  | { id: string; input: unknown; name: string; type: 'tool_use' }
  | { text: string; type: 'text' }
  | { text: string; type: 'thinking' }
export type CodegenRunnerResult = {
  /** For agent results: process exit code. */
  agentExitCode?: number
  /** For agent results: captured stderr from the CLI (fallback when stream-json parsing yields no events), truncated to ~10,000 characters. */
  agentLog?: string
  confidence: number
  modifiedConfig: string
  /** For agent results: structured per-event transcript parsed from stream-json output. */
  transcript?: TranscriptEvent[]
  usage: TokenUsage
}
// Scorer
export type ConfigChangeScorerResult = {
  changeDescription: string
  completeness: number
  correctness: number
  pass: boolean
  reasoning: string
  score: number
  usage: TokenUsage
}
export type ScoreConfigChangeOptions = {
  model?: LanguageModel
}

// Spec
export type EvalResult = {
  /** For agent results: process exit code. */
  agentExitCode?: number
  /** For agent results: captured stdout+stderr from the CLI, truncated to ~10,000 characters. */
  agentLog?: string
  answer: string
  /** Populated when one or more structural assertions fail */
  assertionErrors?: string[]
  category: string
  /** Named by the scorer: the precise change made to the config */
  changeDescription?: string
  /** Scorer sub-score: fraction of key concepts present (0–1) */
  completeness?: number
  confidence: number
  /** Folder under `test/evals/fixtures/` that contains the starter config. */
  configPath: string
  /** Scorer sub-score: factual accuracy of the answer (0–1) */
  correctness?: number
  /** Runner model ID (e.g. "openai/gpt-5.2") — surfaced in the dashboard for cross-run comparison */
  modelId?: string
  pass: boolean
  question: string
  reasoning: string
  /**
   * Identifies the eval invocation that produced this result (ISO timestamp set
   * once per `pnpm test:eval` run). Lets the dashboard group results into
   * discrete runs. Absent on entries cached before run-tracking existed.
   */
  runId?: string
  /**
   * Which runner produced this result. Surfaced in the dashboard. Required for
   * all entries written by this branch; old cache entries may be missing it —
   * read sites should default-coerce to `'llm'`.
   */
  runnerKind: RunnerKind
  /** True when `verify` booted the generated config through the lazy Payload API. */
  runtimeUsed?: boolean
  /** Weighted score: (0.6 × correctness) + (0.4 × completeness) */
  score?: number
  /** For agent results only: how the skill was installed in the workdir. */
  skillInstall?: SkillInstallMode
  /** For codegen results: the exact starter file contents the LLM was given. Captured so the dashboard diff stays accurate even after a fixture is edited. */
  starterContent?: string
  /** Which system prompt variant was used — enables skill vs. baseline comparison in the dashboard */
  systemPromptKey?: SystemPromptKey
  /** For agent results: structured per-event transcript parsed from stream-json output. */
  transcript?: TranscriptEvent[]
  /** Populated when TypeScript compilation fails */
  tscErrors?: string[]
  /** Token usage across all LLM calls for this eval case */
  usage?: EvalUsage
}
export type RunCodegenDatasetOptions = {
  agentModel?: string
  /** Expose the starter config's Payload MCP tools to the runner. */
  exposeMcpTools?: boolean
  kind?: RunnerKind
  runnerModel?: LanguageModel
  scorerModel?: LanguageModel
  skillInstall?: SkillInstallMode
  systemPromptKey?: SystemPromptKey
}

// Validate
export type ValidateResult = {
  errors: string[]
  valid: boolean
}
