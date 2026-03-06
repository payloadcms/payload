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
    runnerModel = DEFAULT_RUNNER_MODEL,
    scorerModel = DEFAULT_SCORER_MODEL,
    systemPromptKey = 'qaWithSkill',
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
        expected: testCase.expected,
        fixturePath: testCase.fixturePath,
        input: testCase.input,
        modelId: runnerModelId,
        systemPromptKey,
      })

      const cached = getCachedResult(key)
      if (cached) {
        // Backfill systemPromptKey / modelId into entries written before these fields were added.
        // Re-save so the cache file on disk is updated and the dashboard can pair them.
        const needsBackfill = !cached.systemPromptKey || !cached.modelId
        const taggedResult = needsBackfill
          ? {
              ...cached,
              modelId: cached.modelId ?? runnerModelId,
              systemPromptKey: cached.systemPromptKey ?? systemPromptKey,
            }
          : cached
        if (needsBackfill) {
          setCachedResult(key, taggedResult)
        }
        const cachedScore =
          taggedResult.score != null ? `  score: ${taggedResult.score.toFixed(2)}` : ''
        console.log(
          `[${taggedResult.category}] ${taggedResult.pass ? '✓ PASS' : '✗ FAIL'} (cached)${cachedScore}`,
        )
        console.log(`  Q: ${taggedResult.question}`)
        return taggedResult
      }

      const run = await runEval(prompt, { model: runnerModel, systemPromptKey })
      const {
        completeness,
        correctness,
        pass,
        reasoning,
        score,
        usage: scorerUsage,
      } = await scoreAnswer(testCase.input, testCase.expected, run.answer, {
        model: scorerModel,
      })
      const result: EvalResult = {
        answer: run.answer,
        category: testCase.category,
        completeness,
        confidence: run.confidence,
        correctness,
        modelId: runnerModelId,
        pass,
        question: testCase.input,
        reasoning,
        score,
        systemPromptKey,
        usage: {
          runner: run.usage,
          scorer: scorerUsage,
          total: {
            cachedInputTokens: run.usage.cachedInputTokens + scorerUsage.cachedInputTokens,
            inputTokens: run.usage.inputTokens + scorerUsage.inputTokens,
            outputTokens: run.usage.outputTokens + scorerUsage.outputTokens,
            totalTokens: run.usage.totalTokens + scorerUsage.totalTokens,
          },
        },
      }

      setCachedResult(key, result)

      if (!pass) {
        writeFailedQAAssertion(
          {
            answer: run.answer,
            category: testCase.category,
            confidence: run.confidence,
            expected: testCase.expected,
            label,
            question: testCase.input,
            reasoning,
            starterConfig,
          },
          idx,
        )
      }

      const status = pass ? '✓ PASS' : '✗ FAIL'
      console.log(
        `[${result.category}] ${status}  score: ${score.toFixed(2)}  (correctness: ${correctness.toFixed(2)} · completeness: ${completeness.toFixed(2)})`,
      )
      console.log(`  Q: ${result.question}`)
      console.log(`  A: ${result.answer}`)
      if (!pass) {
        console.log(`  Reason: ${reasoning}`)
      }

      return result
    }),
  )

  const { accuracy, averageScore, failed, passed } = accuracySummary(results)

  const avgScoreStr = averageScore != null ? `  avg score: ${averageScore.toFixed(2)}` : ''
  console.log(
    `\nAccuracy: ${passed.length}/${results.length} (${(accuracy * 100).toFixed(0)}%)${avgScoreStr}`,
  )

  if (failed.length > 0) {
    console.log('\nFailed cases:')
    for (const r of failed) {
      console.log(`  - [${r.category}] ${r.question}`)
      console.log(`    Reason: ${r.reasoning}`)
    }
  }

  return { accuracy, results }
}
