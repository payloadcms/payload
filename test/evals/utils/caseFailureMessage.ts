import type { EvalResult } from '../types.js'

export function caseFailureMessage(result: EvalResult): string {
  const lines: string[] = []

  if (result.tscErrors?.length) {
    lines.push('TypeScript compilation failed:')
    for (const err of result.tscErrors.slice(0, 5)) {
      lines.push(`  ${err}`)
    }
    if (result.tscErrors.length > 5) {
      lines.push(`  … and ${result.tscErrors.length - 5} more`)
    }
  } else {
    if (result.score != null) {
      lines.push(
        `Score: ${result.score.toFixed(2)} (correctness: ${result.correctness?.toFixed(2)} · completeness: ${result.completeness?.toFixed(2)})`,
      )
    }
    if (result.changeDescription) {
      lines.push(`Change: ${result.changeDescription}`)
    }
    lines.push(`Reason: ${result.reasoning}`)
  }

  lines.push('', 'See test/evals/eval-results/failed-assertions/ for full data.')
  return lines.join('\n')
}
