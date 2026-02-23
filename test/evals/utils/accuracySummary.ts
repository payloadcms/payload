import type { EvalResult } from '../types.js'

export function accuracySummary(results: EvalResult[]): {
  accuracy: number
  failed: EvalResult[]
  passed: EvalResult[]
} {
  const passed = results.filter((r) => r.pass)
  const failed = results.filter((r) => !r.pass)
  const accuracy = passed.length / results.length
  return { accuracy, failed, passed }
}
