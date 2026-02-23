import type { EvalResult } from '../types.js'

export function failureMessage(accuracy: number, failed: EvalResult[]): string {
  const cases = failed.map((r) => r.question).join(', ')
  return `Accuracy ${(accuracy * 100).toFixed(0)}% below threshold. Failed: ${cases}\nSee test/evals/eval-results/failed-assertions/ for full response data.`
}
