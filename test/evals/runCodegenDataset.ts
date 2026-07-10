/* eslint-disable no-console -- eval runner reports case progress and summaries */

import type { Payload } from 'payload'

import { randomUUID } from 'node:crypto'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { expect as vitestExpect } from 'vitest'

import type { MCPEvalDatabase } from './mcpDatabase.js'
import type {
  CodegenRunnerResult,
  ConfigChangeScorerResult,
  EvalCase,
  EvalExpect,
  EvalResult,
  EvalUsage,
  RunCodegenDatasetOptions,
  TokenUsage,
} from './types.js'

import { parseConfig } from './assertions/parseConfig.js'
import { buildEvalConfig, missingEvalConfig, unwrapEvalConfigValue } from './evalConfig.js'
import { createMCPEvalDatabase, setMCPEvalDatabaseEnvironment } from './mcpDatabase.js'
import { DEFAULT_RUNNER_MODEL, DEFAULT_SCORER_MODEL } from './models.js'
import { codegenParamsHash } from './paramsHash.js'
import { capTranscript, getAgentVersion } from './runner/claudeCode.js'
import { runCodegenEval } from './runner/index.js'
import { findReusableResult, recordRunResult, shouldRerun } from './runResults.js'
import { scoreConfigChange, scoreEvidence } from './scorer/index.js'
import { accuracySummary, writeFailedCodegenAssertion } from './utils/index.js'
import { validateConfigTypes } from './validate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')
let runtimeVerifyLock: Promise<void> = Promise.resolve()

class VerifyFailure extends Error {
  assertionErrors?: string[]
}

/**
 * Runs the full codegen pipeline for a single eval case:
 *   1. LLM modifies the per-case starter payload.config.ts
 *   2. TypeScript compiler validates the result (hard check)
 *   3. `verify` performs deterministic config checks, runtime checks, scorer
 *      checks, or any combination of those through one readable function.
 *
 * Cases with identical parameters can reuse a previous completed result.
 */
export async function runCodegenCase(
  testCase: EvalCase,
  label: string,
  options: RunCodegenDatasetOptions = {},
): Promise<EvalResult> {
  const {
    agentModel,
    exposeMcpTools,
    kind = 'llm',
    runnerModel = DEFAULT_RUNNER_MODEL,
    scorerModel = DEFAULT_SCORER_MODEL,
    skillInstall,
    systemPromptKey = 'codegenWithSkill',
  } = options

  const llmModelId = (() => {
    const m = runnerModel as { modelId?: string; provider?: string }
    return `${m.provider ?? 'unknown'}/${m.modelId ?? 'unknown'}`
  })()

  const agentVersion = kind === 'claude-code' ? await getAgentVersion() : undefined
  const resolvedModelId =
    kind === 'claude-code'
      ? `claude-code/${agentModel ?? 'claude-opus-4-6'}/${agentVersion ?? 'unknown'}`
      : llmModelId

  const starterConfig = readFileSync(
    path.join(fixturesDir, testCase.configPath, 'payload.config.ts'),
    'utf-8',
  )

  const paramsHash = codegenParamsHash({
    category: testCase.category,
    configPath: testCase.configPath,
    fixtureContent: starterConfig,
    input: testCase.input,
    modelId: resolvedModelId,
    runnerKind: kind,
    skillInstall: kind === 'claude-code' ? skillInstall : undefined,
    systemPromptKey: kind === 'llm' ? systemPromptKey : undefined,
  })

  const reusable = !shouldRerun() ? findReusableResult({ paramsHash }) : undefined
  if (reusable) {
    const previous = reusable.result
    console.log(`[${previous.category}] ↷ SKIP (identical parameters)  ${testCase.configPath}`)
    console.log(`  Task: ${previous.question}`)
    return recordRunResult({
      paramsHash,
      result: { ...previous, reusedFromRunId: previous.runId, usage: undefined },
      reusedFromRunId: previous.runId,
    })
  }

  const recordResult = (result: EvalResult): EvalResult => recordRunResult({ paramsHash, result })

  if (exposeMcpTools && !testCase.bootConfig) {
    throw new Error('MCP eval cases must enable bootConfig')
  }

  const mcpDatabase = exposeMcpTools ? createMCPEvalDatabase() : undefined

  let lazyPayload = testCase.bootConfig
    ? createLazyPayload({ mcpDatabase, modifiedConfig: starterConfig, testCase })
    : undefined
  let runnerOutput: CodegenRunnerResult

  try {
    const payload = await lazyPayload?.boot()
    if (payload && testCase.setup) {
      await testCase.setup({ payload })
    }
    runnerOutput = await runCodegenEval(testCase.input, starterConfig, {
      agentModel,
      configPath: testCase.configPath,
      exposeMcpTools,
      kind,
      mcpConfigPath: exposeMcpTools ? lazyPayload?.configFilePath : undefined,
      mcpDatabaseURL: mcpDatabase?.url,
      model: runnerModel,
      skillInstall,
      systemPromptKey,
    })
  } catch (error) {
    await lazyPayload?.cleanup()
    throw error
  }

  const { confidence, modifiedConfig, usage: runnerUsage } = runnerOutput
  const agentLog = runnerOutput.agentLog
  const agentExitCode = runnerOutput.agentExitCode
  const audit = runnerOutput.audit ?? []
  const transcript = runnerOutput.transcript

  const commonResult = {
    agentExitCode,
    agentLog,
    answer: modifiedConfig,
    audit: audit.length > 0 ? audit : undefined,
    category: testCase.category,
    confidence,
    configPath: testCase.configPath,
    modelId: resolvedModelId,
    question: testCase.input,
    runnerKind: kind,
    skillInstall: kind === 'claude-code' ? skillInstall : undefined,
    starterContent: starterConfig,
    systemPromptKey: kind === 'llm' ? systemPromptKey : undefined,
    transcript: transcript ? capTranscript(transcript) : undefined,
  } satisfies Partial<EvalResult>

  const { errors: tscErrors, valid } = await validateConfigTypes({
    name: `${testCase.configPath}-${paramsHash.slice(0, 12)}`,
    configContent: modifiedConfig,
    configPath: testCase.configPath,
  })

  if (!valid) {
    const result: EvalResult = {
      ...commonResult,
      pass: false,
      reasoning: `TypeScript compilation failed:\n${tscErrors.join('\n')}`,
      score: 0,
      tscErrors,
      usage: runnerOnlyUsage(runnerUsage),
    }
    const recordedResult = recordResult(result)
    writeFailure({ label, modifiedConfig, paramsHash, result, starterConfig })
    console.log(`[${result.category}] ✗ FAIL [TSC]  ${testCase.configPath}`)
    for (const err of tscErrors) {
      console.log(`  TSC: ${err}`)
    }
    await lazyPayload?.cleanup()
    return recordedResult
  }

  const ast = parseConfig(modifiedConfig)
  let evalConfig = missingEvalConfig()

  if (verifyUsesArg(testCase.verify, 'config')) {
    try {
      evalConfig = await importGeneratedEvalConfig(testCase, modifiedConfig)
    } catch (error) {
      const result: EvalResult = {
        ...commonResult,
        pass: false,
        reasoning: `Generated config import failed:\n${formatError(error)}`,
        score: 0,
        usage: runnerOnlyUsage(runnerUsage),
      }
      const recordedResult = recordResult(result)
      writeFailure({ label, modifiedConfig, paramsHash, result, starterConfig })
      console.log(`[${result.category}] ✗ FAIL [IMPORT]  ${testCase.configPath}`)
      console.log(`  Reason: ${result.reasoning}`)
      await lazyPayload?.cleanup()
      return recordedResult
    }
  }

  lazyPayload ??= createLazyPayload({ mcpDatabase, modifiedConfig, testCase })
  let scorerResult: ConfigChangeScorerResult | undefined

  const score = async (expected: string, evidence?: unknown): Promise<ConfigChangeScorerResult> => {
    scorerResult =
      evidence === undefined
        ? await scoreConfigChange(testCase.input, expected, starterConfig, modifiedConfig, {
            model: scorerModel,
          })
        : await scoreEvidence(testCase.input, expected, evidence, { model: scorerModel })

    return scorerResult
  }

  try {
    const verifyPayload = await resolveVerifyPayload({
      boot: lazyPayload.boot,
      lazyPayload: lazyPayload.payload,
      verify: testCase.verify,
    })
    const verifyResult = await testCase.verify({
      ast,
      audit,
      config: evalConfig,
      expect: createEvalExpect(),
      payload: verifyPayload,
      score,
      source: modifiedConfig,
      transcript: transcript ?? [],
    })
    const resolvedScore = verifyResult ?? scorerResult
    const result: EvalResult = resolvedScore
      ? {
          ...commonResult,
          changeDescription: resolvedScore.changeDescription,
          completeness: resolvedScore.completeness,
          correctness: resolvedScore.correctness,
          pass: resolvedScore.pass,
          reasoning: resolvedScore.reasoning,
          runtimeUsed: lazyPayload.didBoot(),
          score: resolvedScore.score,
          usage: usageWithScorer(runnerUsage, resolvedScore.usage),
        }
      : {
          ...commonResult,
          pass: true,
          reasoning: lazyPayload.didBoot() ? 'Runtime verification passed' : 'Verification passed',
          runtimeUsed: lazyPayload.didBoot(),
          usage: runnerOnlyUsage(runnerUsage),
        }

    const recordedResult = recordResult(result)

    if (!result.pass) {
      writeFailure({ label, modifiedConfig, paramsHash, result, starterConfig })
    }

    logResult(recordedResult)
    return recordedResult
  } catch (error) {
    const verifyError = normalizeVerifyError(error)
    const result: EvalResult = {
      ...commonResult,
      assertionErrors: verifyError.assertionErrors,
      pass: false,
      reasoning: verifyError.message,
      runtimeUsed: lazyPayload.didBoot(),
      score: 0,
      usage: runnerOnlyUsage(runnerUsage),
    }

    const recordedResult = recordResult(result)

    writeFailure({ label, modifiedConfig, paramsHash, result, starterConfig })
    console.log(`[${result.category}] ✗ FAIL [VERIFY]  ${testCase.configPath}`)
    console.log(`  Reason: ${result.reasoning}`)
    return recordedResult
  } finally {
    await lazyPayload.cleanup()
  }
}

export async function resolveVerifyPayload({
  boot,
  lazyPayload,
  verify,
}: {
  boot: () => Promise<Payload>
  lazyPayload: Payload
  verify: EvalCase['verify']
}): Promise<Payload> {
  return verifyUsesArg(verify, 'payload') ? boot() : lazyPayload
}

function createEvalExpect(): EvalExpect {
  const evalExpect = ((actual: unknown, message?: string) =>
    vitestExpect(unwrapEvalConfigValue(actual), message)) as EvalExpect

  Object.assign(evalExpect, vitestExpect)

  return evalExpect
}

async function importGeneratedEvalConfig(
  testCase: EvalCase,
  modifiedConfig: string,
): Promise<Awaited<ReturnType<typeof buildEvalConfig>>> {
  const configDir = path.resolve(fixturesDir, testCase.configPath)
  const configFile = `payload.generated.${randomUUID()}.config.ts`
  const configFilePath = path.join(configDir, configFile)

  writeFileSync(configFilePath, modifiedConfig, 'utf-8')

  try {
    const imported = (await import(pathToFileURL(configFilePath).href)) as {
      default: unknown
    }
    const generatedConfig = await imported.default
    return buildEvalConfig(generatedConfig as Parameters<typeof buildEvalConfig>[0])
  } finally {
    rmSync(configFilePath, { force: true })
  }
}

function verifyUsesArg(verify: EvalCase['verify'], argName: string): boolean {
  const source = `const verify = ${verify.toString()}`
  const sourceFile = parseConfigSource(source)
  const statement = sourceFile.statements[0]
  if (!statement || !ts.isVariableStatement(statement)) {
    return false
  }

  const initializer = statement.declarationList.declarations[0]?.initializer
  if (!initializer || !isArrowOrFunctionExpression(initializer)) {
    return false
  }

  const firstParam = initializer.parameters[0]?.name
  if (!firstParam) {
    return false
  }

  if (bindingIncludesName(firstParam, argName)) {
    return true
  }

  return ts.isIdentifier(firstParam)
    ? bodyReadsProperty(initializer.body, firstParam.text, argName)
    : false
}

function bindingIncludesName(binding: ts.BindingName, name: string): boolean {
  if ('text' in binding) {
    return binding.text === name
  }

  return binding.elements.some((element) => {
    if (ts.isOmittedExpression(element)) {
      return false
    }
    const propertyName = element.propertyName
    if (propertyName && 'text' in propertyName && propertyName.text === name) {
      return true
    }
    return bindingIncludesName(element.name, name)
  })
}

function parseConfigSource(source: string): ts.SourceFile {
  return ts.createSourceFile('verify.ts', source, ts.ScriptTarget.Latest, true)
}

function bodyReadsProperty(body: ts.ConciseBody, objectName: string, propName: string): boolean {
  let found = false

  const visit = (node: ts.Node): void => {
    if (found) {
      return
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === objectName &&
      node.name.text === propName
    ) {
      found = true
      return
    }

    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === objectName &&
      ts.isStringLiteral(node.argumentExpression) &&
      node.argumentExpression.text === propName
    ) {
      found = true
      return
    }

    node.forEachChild(visit)
  }

  visit(body)
  return found
}

function isArrowOrFunctionExpression(
  node: ts.Node,
): node is ts.ArrowFunction | ts.FunctionExpression {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node)
}

function createLazyPayload({
  mcpDatabase,
  modifiedConfig,
  testCase,
}: {
  mcpDatabase?: MCPEvalDatabase
  modifiedConfig: string
  testCase: EvalCase
}): {
  boot: () => Promise<Payload>
  cleanup: () => Promise<void>
  configFilePath: string
  didBoot: () => boolean
  payload: Payload
} {
  let payload: Payload | undefined
  let payloadPromise: Promise<Payload> | undefined
  let releaseRuntime: (() => void) | undefined
  const configDir = path.resolve(fixturesDir, testCase.configPath)
  const configFile = `payload.generated.${randomUUID()}.config.ts`
  const configFilePath = path.join(configDir, configFile)
  const suiteName = path.join('evals', 'fixtures', testCase.configPath)

  const getPayload = async () => {
    if (!payloadPromise) {
      payloadPromise = (async () => {
        const releaseBoot = await acquireRuntimeVerifyLock()
        releaseRuntime = releaseBoot

        writeFileSync(configFilePath, modifiedConfig, 'utf-8')

        const previousDropDatabase = process.env.PAYLOAD_DROP_DATABASE
        const restoreMCPEnvironment = mcpDatabase
          ? setMCPEvalDatabaseEnvironment({ databaseURL: mcpDatabase.url })
          : undefined

        if (!mcpDatabase) {
          process.env.PAYLOAD_DROP_DATABASE = 'true'
        }

        try {
          const { initPayloadInt } = await import('../__helpers/shared/initPayloadInt.js')
          payload = (
            await initPayloadInt(configDir, suiteName, undefined, configFile, {
              payloadKey: configFile,
            })
          ).payload
          return payload
        } finally {
          if (restoreMCPEnvironment) {
            restoreMCPEnvironment()
          } else if (previousDropDatabase === undefined) {
            delete process.env.PAYLOAD_DROP_DATABASE
          } else {
            process.env.PAYLOAD_DROP_DATABASE = previousDropDatabase
          }

          if (mcpDatabase) {
            releaseRuntime()
            releaseRuntime = undefined
          }
        }
      })()
    }

    return payloadPromise
  }

  const lazy = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return undefined
        }

        return async (...args: unknown[]) => {
          const realPayload = await getPayload()
          const value = realPayload[prop as keyof Payload]

          if (typeof value === 'function') {
            return Reflect.apply(value as (...args: unknown[]) => unknown, realPayload, args)
          }

          return value
        }
      },
    },
  ) as Payload

  return {
    boot: getPayload,
    cleanup: async () => {
      try {
        await payloadPromise?.catch(() => undefined)
        await payload?.destroy()
      } finally {
        rmSync(configFilePath, { force: true })
        mcpDatabase?.cleanup()
        releaseRuntime?.()
        releaseRuntime = undefined
      }
    },
    configFilePath,
    didBoot: () => Boolean(payloadPromise),
    payload: lazy,
  }
}

async function acquireRuntimeVerifyLock(): Promise<() => void> {
  let release!: () => void
  const previous = runtimeVerifyLock

  runtimeVerifyLock = previous.then(
    () =>
      new Promise<void>((resolve) => {
        release = resolve
      }),
  )

  await previous
  return release
}

function normalizeVerifyError(error: unknown): VerifyFailure {
  if (error instanceof VerifyFailure) {
    return error
  }

  const normalized = new VerifyFailure(formatError(error))
  return normalized
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function runnerOnlyUsage(runnerUsage: TokenUsage): EvalUsage {
  return {
    runner: runnerUsage,
    total: {
      cachedInputTokens: runnerUsage.cachedInputTokens,
      inputTokens: runnerUsage.inputTokens,
      outputTokens: runnerUsage.outputTokens,
      totalTokens: runnerUsage.totalTokens,
    },
  }
}

function usageWithScorer(runnerUsage: TokenUsage, scorerUsage: TokenUsage): EvalUsage {
  return {
    runner: runnerUsage,
    scorer: scorerUsage,
    total: {
      cachedInputTokens: runnerUsage.cachedInputTokens + scorerUsage.cachedInputTokens,
      inputTokens: runnerUsage.inputTokens + scorerUsage.inputTokens,
      outputTokens: runnerUsage.outputTokens + scorerUsage.outputTokens,
      totalTokens: runnerUsage.totalTokens + scorerUsage.totalTokens,
    },
  }
}

function writeFailure({
  label,
  modifiedConfig,
  paramsHash,
  result,
  starterConfig,
}: {
  label: string
  modifiedConfig: string
  paramsHash: string
  result: EvalResult
  starterConfig: string
}) {
  writeFailedCodegenAssertion({
    agentExitCode: result.agentExitCode,
    agentLog: result.agentLog,
    audit: result.audit,
    category: result.category,
    changeDescription: result.changeDescription,
    confidence: result.confidence,
    configPath: result.configPath,
    label,
    modifiedConfig,
    paramsHash,
    question: result.question,
    reasoning: result.reasoning,
    starterConfig,
    transcript: result.transcript,
    tscErrors: result.tscErrors,
  })
}

function logResult(result: EvalResult) {
  const status = result.pass ? '✓ PASS' : '✗ FAIL'
  const mode = result.runtimeUsed ? ' [RUNTIME]' : ''

  if (result.score == null) {
    console.log(`[${result.category}] ${status}${mode}  ${result.configPath}`)
  } else {
    console.log(
      `[${result.category}] ${status}${mode}  score: ${result.score.toFixed(2)}  (correctness: ${result.correctness?.toFixed(2)} · completeness: ${result.completeness?.toFixed(2)})`,
    )
  }

  console.log(`  Task: ${result.question}`)
  if (result.changeDescription) {
    console.log(`  Change: ${result.changeDescription}`)
  }
  if (!result.pass) {
    console.log(`  Reason: ${result.reasoning}`)
  }
}

/**
 * Runs codegen evals for an entire dataset and returns aggregate accuracy.
 * Delegates per-case work to runCodegenCase.
 */
export async function runCodegenDataset(
  dataset: EvalCase[],
  label: string,
  options: RunCodegenDatasetOptions = {},
): Promise<{ accuracy: number; results: EvalResult[] }> {
  const categories = [...new Set(dataset.map((c) => c.category))]

  console.log(`\n=== ${label} Eval Results (${dataset.length} cases) ===`)
  console.log(`  Categories: ${categories.join(', ')}`)
  for (const c of dataset) {
    console.log(`  · ${c.configPath}: ${c.input}`)
  }

  if (shouldRerun()) {
    console.log('  EVAL_RERUN=true — running cases even when parameters are identical')
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
