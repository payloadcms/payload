import type { LanguageModel } from 'ai'

// Dataset
export type EvalCategory =
  | 'coding'
  | 'collections'
  | 'commits'
  | 'config'
  | 'development'
  | 'fields'
  | 'structure'
  | 'testing'

export type EvalCase = {
  category: EvalCategory
  expected: string
  input: string
}

// Models
export type ModelKey = 'openai:gpt-4o' | 'openai:gpt-4o-mini' | 'openai:gpt-5.2'

// Runner
export type SystemPromptKey = 'codegen' | 'qa'
export type RunnerResult = {
  answer: string
  confidence: number
}
export type RunEvalOptions = {
  model?: LanguageModel
  systemPromptKey?: SystemPromptKey
}

// Scorer
export type ScorerResult = {
  pass: boolean
  reasoning: string
}
export type ScoreAnswerOptions = {
  model?: LanguageModel
}

// Spec
export type EvalResult = {
  answer: string
  category: string
  confidence: number
  pass: boolean
  question: string
  reasoning: string
}
export type RunDatasetOptions = {
  runnerModel?: LanguageModel
  scorerModel?: LanguageModel
  systemPromptKey?: SystemPromptKey
}
