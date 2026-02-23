import type { LanguageModel } from 'ai'

// Dataset
export type EvalCategory =
  | 'coding'
  | 'collections'
  | 'commits'
  | 'config'
  | 'development'
  | 'fields'
  | 'negative'
  | 'plugins'
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
  pass: boolean
  reasoning: string
}
export type ConfigChangeScorerResult = {
  changeDescription: string
  pass: boolean
  reasoning: string
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
  confidence: number
  pass: boolean
  question: string
  reasoning: string
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
