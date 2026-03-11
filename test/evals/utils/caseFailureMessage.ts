import type { EvalResult } from '../types.js'

export function caseFailureMessage(result: EvalResult): string {
  if (result.tscErrors?.length) {
    return `TypeScript compilation failed:\n  ${result.tscErrors[0]}\nSee test/evals/eval-results/failed-assertions/ for full response data.`
  }
  const scoreStr =
    result.score != null
      ? `score: ${result.score.toFixed(2)} (correctness: ${result.correctness?.toFixed(2)} · completeness: ${result.completeness?.toFixed(2)})`
      : ''
  return `${scoreStr}\n  ${result.reasoning}\nSee test/evals/eval-results/failed-assertions/ for full response data.`
}
