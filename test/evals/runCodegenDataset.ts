import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CodegenEvalCase, EvalResult, RunCodegenDatasetOptions } from './types.js'

import { codegenKey, getCachedResult, isCacheBypassed, setCachedResult } from './cache.js'
import { DEFAULT_RUNNER_MODEL, DEFAULT_SCORER_MODEL } from './models.js'
import { runCodegenEval } from './runner/index.js'
import { scoreConfigChange } from './scorer/index.js'
import { accuracySummary, writeFailedCodegenAssertion } from './utils/index.js'
import { validateConfigTypes } from './validate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

/**
 * Runs the full codegen pipeline for a single eval case:
 *   1. LLM modifies the per-case starter payload.config.ts
 *   2. TypeScript compiler validates the result (hard check)
 *   3. LLM scorer compares before/after and names the precise change (soft check)
 *
 * Results are cached by a hash of the inputs. Pass label for logging context.
 */
export async function runCodegenCase(
  testCase: CodegenEvalCase,
  label: string,
  options: RunCodegenDatasetOptions = {},
): Promise<EvalResult> {
  const {
    runnerModel = DEFAULT_RUNNER_MODEL,
    scorerModel = DEFAULT_SCORER_MODEL,
    systemPromptKey = 'qaWithSkill',
  } = options

  const m = runnerModel as { modelId?: string; provider?: string }
  const runnerModelId = `${m.provider ?? 'unknown'}/${m.modelId ?? 'unknown'}`

  const starterConfig = readFileSync(
    path.join(fixturesDir, testCase.fixturePath, 'payload.config.ts'),
    'utf-8',
  )

  const key = codegenKey({
    expected: testCase.expected,
    fixtureContent: starterConfig,
    input: testCase.input,
    modelId: runnerModelId,
    systemPromptKey,
  })

  const bypassCache = isCacheBypassed()
  const cached = !bypassCache && getCachedResult(key)
  if (cached) {
    const needsBackfill = !cached.modelId || !cached.systemPromptKey
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
    console.log(`  Task: ${taggedResult.question}`)
    return taggedResult
  }

  const {
    confidence,
    modifiedConfig,
    usage: runnerUsage,
  } = await runCodegenEval(testCase.input, starterConfig, {
    model: runnerModel,
    systemPromptKey,
  })

  const { errors: tscErrors, valid } = await validateConfigTypes(
    modifiedConfig,
    testCase.fixturePath,
  )

  if (!valid) {
    const result: EvalResult = {
      answer: modifiedConfig,
      category: testCase.category,
      confidence,
      modelId: runnerModelId,
      pass: false,
      question: testCase.input,
      systemPromptKey,
      reasoning: `TypeScript compilation failed:\n${tscErrors.join('\n')}`,
      tscErrors,
      usage: {
        runner: runnerUsage,
        total: {
          cachedInputTokens: runnerUsage.cachedInputTokens,
          inputTokens: runnerUsage.inputTokens,
          outputTokens: runnerUsage.outputTokens,
          totalTokens: runnerUsage.totalTokens,
        },
      },
    }
    setCachedResult(key, result)
    writeFailedCodegenAssertion({
      category: testCase.category,
      confidence,
      fixturePath: testCase.fixturePath,
      label,
      modifiedConfig,
      question: testCase.input,
      reasoning: result.reasoning,
      starterConfig,
      tscErrors,
    })
    console.log(`[${result.category}] ✗ FAIL [TSC]  ${testCase.fixturePath}`)
    for (const err of tscErrors) {
      console.log(`  TSC: ${err}`)
    }
    return result
  }

  const {
    changeDescription,
    completeness,
    correctness,
    pass,
    reasoning,
    score,
    usage: scorerUsage,
  } = await scoreConfigChange(testCase.input, testCase.expected, starterConfig, modifiedConfig, {
    model: scorerModel,
  })

  const result: EvalResult = {
    answer: modifiedConfig,
    category: testCase.category,
    changeDescription,
    completeness,
    confidence,
    correctness,
    modelId: runnerModelId,
    pass,
    question: testCase.input,
    systemPromptKey,
    reasoning,
    score,
    usage: {
      runner: runnerUsage,
      scorer: scorerUsage,
      total: {
        cachedInputTokens: runnerUsage.cachedInputTokens + scorerUsage.cachedInputTokens,
        inputTokens: runnerUsage.inputTokens + scorerUsage.inputTokens,
        outputTokens: runnerUsage.outputTokens + scorerUsage.outputTokens,
        totalTokens: runnerUsage.totalTokens + scorerUsage.totalTokens,
      },
    },
  }

  setCachedResult(key, result)

  if (!pass) {
    writeFailedCodegenAssertion({
      category: testCase.category,
      changeDescription,
      confidence,
      fixturePath: testCase.fixturePath,
      label,
      modifiedConfig,
      question: testCase.input,
      reasoning,
      starterConfig,
    })
  }

  const status = pass ? '✓ PASS' : '✗ FAIL'
  console.log(
    `[${result.category}] ${status}  score: ${score.toFixed(2)}  (correctness: ${correctness.toFixed(2)} · completeness: ${completeness.toFixed(2)})`,
  )
  console.log(`  Task: ${result.question}`)
  if (changeDescription) {
    console.log(`  Change: ${changeDescription}`)
  }
  if (!pass) {
    console.log(`  Reason: ${reasoning}`)
  }

  return result
}

/**
 * Runs codegen evals for an entire dataset and returns aggregate accuracy.
 * Delegates per-case work to runCodegenCase.
 */
export async function runCodegenDataset(
  dataset: CodegenEvalCase[],
  label: string,
  options: RunCodegenDatasetOptions = {},
): Promise<{ accuracy: number; results: EvalResult[] }> {
  const categories = [...new Set(dataset.map((c) => c.category))]
  console.log(`\n=== ${label} Eval Results (${dataset.length} cases) ===`)
  console.log(`  Categories: ${categories.join(', ')}`)
  for (const c of dataset) {
    console.log(`  · ${c.fixturePath}`)
  }

  if (isCacheBypassed()) {
    console.log('  [cache] EVAL_NO_CACHE=true — cache reads skipped')
  }

  const results = await Promise.all(
    dataset.map((testCase) => runCodegenCase(testCase, label, options)),
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
      if (r.tscErrors?.length) {
        console.log(`    TSC errors: ${r.tscErrors[0]}`)
      } else {
        console.log(`    Reason: ${r.reasoning}`)
      }
    }
  }

  return { accuracy, results }
}
