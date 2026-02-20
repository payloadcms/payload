import type { EvalCase, EvalResult, RunDatasetOptions } from './types.js'

import { DEFAULT_RUNNER_MODEL, DEFAULT_SCORER_MODEL } from './models.js'
import { runEval } from './runner.js'
import { scoreAnswer } from './scorer.js'

export function failureMessage(accuracy: number, failed: EvalResult[]): string {
  return `Accuracy ${(accuracy * 100).toFixed(0)}% below threshold. Failed: ${failed.map((r) => r.question).join(', ')}`
}

export async function runDataset(
  dataset: EvalCase[],
  label: string,
  options: RunDatasetOptions = {},
): Promise<{ accuracy: number; results: EvalResult[] }> {
  const {
    systemPromptKey = 'qa',
    runnerModel = DEFAULT_RUNNER_MODEL,
    scorerModel = DEFAULT_SCORER_MODEL,
  } = options

  const runnerOutputs = await Promise.all(
    dataset.map((testCase) =>
      runEval(testCase.input, { model: runnerModel, systemPromptKey }).then((run) => ({
        testCase,
        ...run,
      })),
    ),
  )

  const results = await Promise.all(
    runnerOutputs.map(({ testCase, answer, confidence }) =>
      scoreAnswer(testCase.input, testCase.expected, answer, { model: scorerModel }).then(
        ({ pass, reasoning }) => ({
          question: testCase.input,
          category: testCase.category,
          answer,
          confidence,
          pass,
          reasoning,
        }),
      ),
    ),
  )

  const passed = results.filter((r) => r.pass)
  const failed = results.filter((r) => !r.pass)
  const accuracy = passed.length / results.length

  console.log(`\n=== ${label} Eval Results ===`)
  for (const r of results) {
    const status = r.pass ? '✓ PASS' : '✗ FAIL'
    console.log(`[${r.category}] ${status} (confidence: ${r.confidence.toFixed(2)})`)
    console.log(`  Q: ${r.question}`)
    console.log(`  A: ${r.answer}`)
    if (!r.pass) {
      console.log(`  Reason: ${r.reasoning}`)
    }
  }
  console.log(`\nAccuracy: ${passed.length}/${results.length} (${(accuracy * 100).toFixed(0)}%)`)

  if (failed.length > 0) {
    console.log('\nFailed cases:')
    for (const r of failed) {
      console.log(`  - [${r.category}] ${r.question}`)
      console.log(`    Reason: ${r.reasoning}`)
    }
  }

  return { accuracy, results }
}
