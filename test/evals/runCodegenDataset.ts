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
 * Runs codegen evals using the three-step pipeline:
 *   1. LLM modifies a per-case starter payload.config.ts
 *   2. TypeScript compiler validates the result (hard check)
 *   3. LLM scorer compares before/after and names the precise change (soft check)
 */
export async function runCodegenDataset(
  dataset: CodegenEvalCase[],
  label: string,
  options: RunCodegenDatasetOptions = {},
): Promise<{ accuracy: number; results: EvalResult[] }> {
  const { runnerModel = DEFAULT_RUNNER_MODEL, scorerModel = DEFAULT_SCORER_MODEL } = options

  const categories = [...new Set(dataset.map((c) => c.category))]
  console.log(`\n=== ${label} Eval Results (${dataset.length} cases) ===`)
  console.log(`  Categories: ${categories.join(', ')}`)
  for (const c of dataset) {
    console.log(`  · ${c.fixturePath}`)
  }

  const bypassCache = isCacheBypassed()
  if (bypassCache) {
    console.log('  [cache] EVAL_NO_CACHE=true — cache reads skipped')
  }

  // LanguageModel is a broad union type; v1 spec objects expose provider and modelId at runtime.
  const m = runnerModel as { modelId?: string; provider?: string }
  const runnerModelId = `${m.provider ?? 'unknown'}/${m.modelId ?? 'unknown'}`

  const results = await Promise.all(
    dataset.map(async (testCase): Promise<EvalResult> => {
      const starterConfig = readFileSync(
        path.join(fixturesDir, testCase.fixturePath, 'payload.config.ts'),
        'utf-8',
      )

      const key = codegenKey({
        input: testCase.input,
        expected: testCase.expected,
        fixtureContent: starterConfig,
        modelId: runnerModelId,
      })

      const cached = getCachedResult(key)
      if (cached) {
        console.log(
          `[${cached.category}] ${cached.pass ? '✓ PASS' : '✗ FAIL'} (cached) (confidence: ${cached.confidence.toFixed(2)})`,
        )
        console.log(`  Task: ${cached.question}`)
        return cached
      }

      const { modifiedConfig, confidence } = await runCodegenEval(testCase.input, starterConfig, {
        model: runnerModel,
      })

      const { valid, errors: tscErrors } = await validateConfigTypes(
        modifiedConfig,
        testCase.fixturePath,
      )

      if (!valid) {
        const result: EvalResult = {
          question: testCase.input,
          category: testCase.category,
          answer: modifiedConfig,
          confidence,
          pass: false,
          reasoning: `TypeScript compilation failed:\n${tscErrors.join('\n')}`,
          tscErrors,
        }
        setCachedResult(key, result)
        writeFailedCodegenAssertion({
          label,
          fixturePath: testCase.fixturePath,
          question: testCase.input,
          category: testCase.category,
          confidence,
          starterConfig,
          modifiedConfig,
          tscErrors,
          reasoning: result.reasoning,
        })
        console.log(`[${result.category}] ✗ FAIL [TSC FAIL] (confidence: ${confidence.toFixed(2)})`)
        console.log(`  Task: ${result.question}`)
        for (const err of tscErrors) {
          console.log(`  TSC: ${err}`)
        }
        return result
      }

      const { pass, reasoning, changeDescription } = await scoreConfigChange(
        testCase.input,
        testCase.expected,
        starterConfig,
        modifiedConfig,
        { model: scorerModel },
      )

      const result: EvalResult = {
        question: testCase.input,
        category: testCase.category,
        answer: modifiedConfig,
        confidence,
        pass,
        reasoning,
        changeDescription,
      }

      setCachedResult(key, result)

      if (!pass) {
        writeFailedCodegenAssertion({
          label,
          fixturePath: testCase.fixturePath,
          question: testCase.input,
          category: testCase.category,
          confidence,
          starterConfig,
          modifiedConfig,
          reasoning,
          changeDescription,
        })
      }

      const status = pass ? '✓ PASS' : '✗ FAIL'
      console.log(`[${result.category}] ${status} (confidence: ${confidence.toFixed(2)})`)
      console.log(`  Task: ${result.question}`)
      if (changeDescription) {
        console.log(`  Change: ${changeDescription}`)
      }
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
      if (r.tscErrors?.length) {
        console.log(`    TSC errors: ${r.tscErrors[0]}`)
      } else {
        console.log(`    Reason: ${r.reasoning}`)
      }
    }
  }

  return { accuracy, results }
}
