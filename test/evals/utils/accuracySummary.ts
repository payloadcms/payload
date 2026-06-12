import type { EvalResult } from '../types.js'

export function accuracySummary(results: EvalResult[]): {
  accuracy: number
  averageScore: null | number
  failed: EvalResult[]
  passed: EvalResult[]
} {
  const passed = results.filter((r) => r.pass)
  const failed = results.filter((r) => !r.pass)
  const accuracy = passed.length / results.length

  const scoredResults = results.filter((r) => r.score != null)
  const averageScore =
    scoredResults.length > 0
      ? scoredResults.reduce((sum, r) => sum + r.score!, 0) / scoredResults.length
      : null

  return { accuracy, averageScore, failed, passed }
}
