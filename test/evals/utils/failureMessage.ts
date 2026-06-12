import type { EvalResult } from '../types.js'

export function failureMessage(accuracy: number, failed: EvalResult[]): string {
  const header = `Accuracy ${(accuracy * 100).toFixed(0)}% below threshold. ${failed.length} failed case(s):\n`
  const details = failed
    .map((r) => {
      const score = r.score != null ? ` (score: ${r.score.toFixed(2)})` : ''
      return [
        `── ${r.question}${score}`,
        `   Answer:   ${truncate(r.answer, 200)}`,
        `   Reason:   ${r.reasoning}`,
      ].join('\n')
    })
    .join('\n\n')
  return `${header}\n${details}\n\nSee test/evals/eval-results/failed-assertions/ for full data.`
}

function truncate(text: string, max: number): string {
  const oneLine = text.replace(/\n/g, ' ').trim()
  return oneLine.length > max ? oneLine.slice(0, max) + '…' : oneLine
}
