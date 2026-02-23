import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { EvalCase, EvalResult, RunDatasetOptions } from './types.js'

import { getCachedResult, isCacheBypassed, qaKey, setCachedResult } from './cache.js'
import { DEFAULT_RUNNER_MODEL, DEFAULT_SCORER_MODEL } from './models.js'
import { runEval } from './runner/index.js'
import { scoreAnswer } from './scorer/index.js'
import { accuracySummary, writeFailedQAAssertion } from './utils/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

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

  const categories = [...new Set(dataset.map((c) => c.category))]
  console.log(`\n=== ${label} Eval Results (${dataset.length} cases) ===`)
  console.log(`  Categories: ${categories.join(', ')}`)
  for (const c of dataset) {
    console.log(`  · ${c.input.length > 80 ? c.input.slice(0, 80) + '…' : c.input}`)
  }

  const bypassCache = isCacheBypassed()
  if (bypassCache) {
    console.log('  [cache] EVAL_NO_CACHE=true — cache reads skipped')
  }

  // LanguageModel is a broad union type; v1 spec objects expose provider and modelId at runtime.
  const m = runnerModel as { modelId?: string; provider?: string }
  const runnerModelId = `${m.provider ?? 'unknown'}/${m.modelId ?? 'unknown'}`

  const results = await Promise.all(
    dataset.map(async (testCase, idx) => {
      // When a fixturePath is present, inject the config file as context before the question.
      let starterConfig: string | undefined
      let prompt = testCase.input
      if (testCase.fixturePath) {
        starterConfig = readFileSync(
          path.join(fixturesDir, testCase.fixturePath, 'payload.config.ts'),
          'utf-8',
        )
        prompt = `Given this payload.config.ts:\n\n\`\`\`ts\n${starterConfig}\n\`\`\`\n\n${testCase.input}`
      }

      const key = qaKey({
        input: testCase.input,
        expected: testCase.expected,
        fixturePath: testCase.fixturePath,
        systemPromptKey,
        modelId: runnerModelId,
      })

      const cached = getCachedResult(key)
      if (cached) {
        console.log(
          `[${cached.category}] ${cached.pass ? '✓ PASS' : '✗ FAIL'} (cached) (confidence: ${cached.confidence.toFixed(2)})`,
        )
        console.log(`  Q: ${cached.question}`)
        return cached
      }

      const run = await runEval(prompt, { model: runnerModel, systemPromptKey })
      const { pass, reasoning } = await scoreAnswer(testCase.input, testCase.expected, run.answer, {
        model: scorerModel,
      })
      const result: EvalResult = {
        question: testCase.input,
        category: testCase.category,
        answer: run.answer,
        confidence: run.confidence,
        pass,
        reasoning,
      }

      setCachedResult(key, result)

      if (!pass) {
        writeFailedQAAssertion(
          {
            label,
            question: testCase.input,
            category: testCase.category,
            confidence: run.confidence,
            expected: testCase.expected,
            answer: run.answer,
            reasoning,
            starterConfig,
          },
          idx,
        )
      }

      const status = pass ? '✓ PASS' : '✗ FAIL'
      console.log(`[${result.category}] ${status} (confidence: ${result.confidence.toFixed(2)})`)
      console.log(`  Q: ${result.question}`)
      console.log(`  A: ${result.answer}`)
      if (!pass) {
        console.log(`  Reason: ${reasoning}`)
      }

      return result
    }),
  )

  const { accuracy, passed, failed } = accuracySummary(results)

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
