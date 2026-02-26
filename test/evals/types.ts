import type { LanguageModel } from 'ai'

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

export type EvalCase = {
  category: EvalCategory
  expected: string
  /**
   * Path to a fixture file relative to test/evals/fixtures/.
   * When set, runDataset reads the file and injects it into the prompt as context
   * (used for config-review / negative-detection cases).
   */
  fixturePath?: string
  input: string
}

export type CodegenEvalCase = {
  category: EvalCategory
  expected: string
  /** Path to the starter fixture directory relative to test/evals/fixtures/ */
  fixturePath: string
  input: string
}

// Models
export type ModelKey = 'openai:gpt-4o' | 'openai:gpt-4o-mini' | 'openai:gpt-5.2'

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
export type SystemPromptKey = 'configModify' | 'configReview' | 'qaNoSkill' | 'qaWithSkill'
export type RunnerResult = {
  answer: string
  confidence: number
  usage: TokenUsage
}
export type CodegenRunnerResult = {
  confidence: number
  modifiedConfig: string
  usage: TokenUsage
}
export type RunEvalOptions = {
  model?: LanguageModel
  systemPromptKey?: SystemPromptKey
}
export type RunCodegenEvalOptions = {
  model?: LanguageModel
}

// Scorer
export type ScorerResult = {
  completeness: number
  correctness: number
  pass: boolean
  reasoning: string
  score: number
  usage: TokenUsage
}
export type ConfigChangeScorerResult = {
  changeDescription: string
  completeness: number
  correctness: number
  pass: boolean
  reasoning: string
  score: number
  usage: TokenUsage
}
export type ScoreAnswerOptions = {
  model?: LanguageModel
}
export type ScoreConfigChangeOptions = {
  model?: LanguageModel
}

// Spec
export type EvalResult = {
  answer: string
  category: string
  /** Named by the scorer: the precise change made to the config */
  changeDescription?: string
  /** Scorer sub-score: fraction of key concepts present (0–1) */
  completeness?: number
  confidence: number
  /** Scorer sub-score: factual accuracy of the answer (0–1) */
  correctness?: number
  /** Runner model ID (e.g. "openai/gpt-5.2") — distinguishes high-power vs low-power in the dashboard */
  modelId?: string
  pass: boolean
  question: string
  reasoning: string
  /** Weighted score: (0.6 × correctness) + (0.4 × completeness) */
  score?: number
  /** Which system prompt variant was used — enables skill vs. baseline comparison in the dashboard */
  systemPromptKey?: SystemPromptKey
  /** Populated when TypeScript compilation fails */
  tscErrors?: string[]
  /** Token usage across all LLM calls for this eval case */
  usage?: EvalUsage
}
export type RunDatasetOptions = {
  runnerModel?: LanguageModel
  scorerModel?: LanguageModel
  systemPromptKey?: SystemPromptKey
}
export type RunCodegenDatasetOptions = {
  runnerModel?: LanguageModel
  scorerModel?: LanguageModel
}

// Validate
export type ValidateResult = {
  errors: string[]
  valid: boolean
}
