import type { LanguageModel } from 'ai'

import type { Assertion } from './assertions/types.js'

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
  | 'negative'
  | 'plugins'
  | 'rest-api'
  | 'structure'
  | 'testing'

export type CodegenEvalCase = {
  /** Optional structural assertions evaluated against the LLM output. Failing any short-circuits the case to fail before the LLM scorer runs. */
  assertions?: Assertion[]
  category: EvalCategory
  expected: string
  /** Path to the starter fixture directory relative to test/evals/fixtures/ */
  fixturePath: string
  input: string
}

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
export type CodegenRunnerResult = {
  confidence: number
  modifiedConfig: string
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
  answer: string
  /** Populated when one or more structural assertions fail */
  assertionErrors?: string[]
  category: string
  /** Named by the scorer: the precise change made to the config */
  changeDescription?: string
  /** Scorer sub-score: fraction of key concepts present (0–1) */
  completeness?: number
  confidence: number
  /** Scorer sub-score: factual accuracy of the answer (0–1) */
  correctness?: number
  /** For codegen results: the fixture directory the starter file came from, relative to test/evals/fixtures/. Used by the dashboard to render a diff. */
  fixturePath?: string
  /** Runner model ID (e.g. "openai/gpt-5.2") — surfaced in the dashboard for cross-run comparison */
  modelId?: string
  pass: boolean
  question: string
  reasoning: string
  /** Weighted score: (0.6 × correctness) + (0.4 × completeness) */
  score?: number
  /** For codegen results: the exact starter file contents the LLM was given. Captured so the dashboard diff stays accurate even after a fixture is edited. */
  starterContent?: string
  /** Which system prompt variant was used — enables skill vs. baseline comparison in the dashboard */
  systemPromptKey?: SystemPromptKey
  /** Populated when TypeScript compilation fails */
  tscErrors?: string[]
  /** Token usage across all LLM calls for this eval case */
  usage?: EvalUsage
}
export type RunCodegenDatasetOptions = {
  runnerModel?: LanguageModel
  scorerModel?: LanguageModel
  systemPromptKey?: SystemPromptKey
}

// Validate
export type ValidateResult = {
  errors: string[]
  valid: boolean
}
