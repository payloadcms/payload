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

// Runner
export type SystemPromptKey = 'configModify' | 'configReview' | 'qa'
export type RunnerResult = {
  answer: string
  confidence: number
}
export type CodegenRunnerResult = {
  confidence: number
  modifiedConfig: string
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
}
export type ConfigChangeScorerResult = {
  changeDescription: string
  completeness: number
  correctness: number
  pass: boolean
  reasoning: string
  score: number
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
  pass: boolean
  question: string
  reasoning: string
  /** Weighted score: (0.6 × correctness) + (0.4 × completeness) */
  score?: number
  /** Populated when TypeScript compilation fails */
  tscErrors?: string[]
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
