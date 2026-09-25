import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import type { BenchmarkSample } from './benchmarkReport.js'
import type { AttributionWorkerResult, WorkerResult } from './measureSchemas.worker.js'
import type { StoredAttributionRun, StoredBenchmarkRun } from './renderBenchmarkReport.js'
import type { BenchmarkScenarioName } from './schemaScenarios.js'

import { getFileDigest, renderBenchmarkReport } from './renderBenchmarkReport.js'
import { benchmarkScenarioNames, isBenchmarkScenarioName } from './schemaScenarios.js'

const workerPath = fileURLToPath(new URL('./measureSchemas.worker.ts', import.meta.url))

const run = (): void => {
  const arguments_ = process.argv.slice(2).filter((argument) => argument !== '--')
  const compareIndex = arguments_.indexOf('--compare')

  if (compareIndex !== -1) {
    const beforePath = arguments_[compareIndex + 1]
    const afterPath = arguments_[compareIndex + 2]
    const attributionPath = getOption({ name: '--attribution-file', arguments_ })
    const markdownPath = getOption({ name: '--markdown', arguments_ })

    if (!beforePath || !afterPath || !attributionPath || !markdownPath) {
      throw new Error(
        '--compare requires before and after files, --attribution-file, and --markdown.',
      )
    }

    const before = readRun({ path: beforePath })
    const after = readRun({ path: afterPath })
    const attribution = readAttributionRun({ path: attributionPath })
    writeFileSync(
      markdownPath,
      renderBenchmarkReport({
        after,
        afterDigest: getFileDigest({ path: afterPath }),
        attribution,
        attributionDigest: getFileDigest({ path: attributionPath }),
        before,
        beforeDigest: getFileDigest({ path: beforePath }),
      }),
      'utf8',
    )
    process.stderr.write(`Wrote ${markdownPath}\n`)
    return
  }

  const outputPath = getOption({ name: '--output', arguments_ })
  const requestedScenario = getOption({ name: '--scenario', arguments_ })
  const iterations = Number(getOption({ name: '--iterations', arguments_ }) ?? '1')
  const isAttribution = arguments_.includes('--attribution')

  if (!outputPath) {
    throw new Error('The benchmark requires --output.')
  }

  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error('--iterations must be a positive integer.')
  }

  if (requestedScenario && !isBenchmarkScenarioName(requestedScenario)) {
    throw new Error(`Unknown scenario "${requestedScenario}".`)
  }

  const scenarios = requestedScenario ? [requestedScenario] : benchmarkScenarioNames

  if (isAttribution) {
    const attributionResults = Object.fromEntries(
      scenarios.map((scenario) => {
        process.stderr.write(`[${scenario}] attribution\n`)

        return [scenario, runAttributionWorker({ scenario })]
      }),
    )
    const firstResult = attributionResults[scenarios[0]]

    if (!firstResult) {
      throw new Error('The attribution run did not produce a result.')
    }

    const output: StoredAttributionRun = {
      environment: firstResult.environment,
      scenarios: attributionResults,
    }

    writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
    process.stderr.write(`Wrote ${outputPath}\n`)
    return
  }

  const rawResults: Record<string, WorkerResult[]> = {}
  const samples: Record<string, BenchmarkSample[]> = {}

  for (const scenario of scenarios) {
    rawResults[scenario] = []
    samples[scenario] = []

    for (let iteration = 1; iteration <= iterations; iteration++) {
      process.stderr.write(`[${scenario}] sample ${iteration}/${iterations}\n`)
      const result = runWorker({ scenario })

      rawResults[scenario].push(result)
      samples[scenario].push(toSample({ result }))
    }
  }

  const firstResult = rawResults[scenarios[0]]![0]

  if (!firstResult) {
    throw new Error('The benchmark did not produce a result.')
  }

  const output: StoredBenchmarkRun = {
    environment: firstResult.environment,
    iterations,
    rawResults,
    scenarios: samples,
  }

  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  process.stderr.write(`Wrote ${outputPath}\n`)
}

const getOption = ({
  name,
  arguments_,
}: {
  arguments_: string[]
  name: string
}): string | undefined => {
  const index = arguments_.indexOf(name)

  return index === -1 ? undefined : arguments_[index + 1]
}

const readRun = ({ path }: { path: string }): StoredBenchmarkRun =>
  JSON.parse(readFileSync(path, 'utf8')) as StoredBenchmarkRun

const readAttributionRun = ({ path }: { path: string }): StoredAttributionRun =>
  JSON.parse(readFileSync(path, 'utf8')) as StoredAttributionRun

const runWorker = ({ scenario }: { scenario: BenchmarkScenarioName }): WorkerResult => {
  return runWorkerProcess<WorkerResult>({ scenario })
}

const runAttributionWorker = ({
  scenario,
}: {
  scenario: BenchmarkScenarioName
}): AttributionWorkerResult =>
  runWorkerProcess<AttributionWorkerResult>({ isAttribution: true, scenario })

const runWorkerProcess = <TResult>({
  isAttribution = false,
  scenario,
}: {
  isAttribution?: boolean
  scenario: BenchmarkScenarioName
}): TResult => {
  const result = spawnSync(
    process.execPath,
    [
      '--max-old-space-size=8192',
      '--expose-gc',
      '--no-deprecation',
      '--import',
      'tsx',
      workerPath,
      scenario,
      ...(isAttribution ? ['--attribution'] : []),
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_NO_WARNINGS: '1',
      },
      maxBuffer: 10 * 1024 * 1024,
    },
  )

  if (result.status !== 0) {
    throw new Error(
      `Benchmark worker failed for ${scenario}.\n${result.stderr || result.stdout || 'No output.'}`,
    )
  }

  try {
    return JSON.parse(result.stdout.trim()) as TResult
  } catch (error) {
    throw new Error(`Benchmark worker returned invalid JSON for ${scenario}: ${result.stdout}`, {
      cause: error,
    })
  }
}

const toSample = ({ result }: { result: WorkerResult }): BenchmarkSample => ({
  externalDelta: result.afterInit.external - result.beforeInit.external,
  heapTotalDelta: result.afterInit.heapTotal - result.beforeInit.heapTotal,
  heapUsedDelta: result.afterInit.heapUsed - result.beforeInit.heapUsed,
  initializationMs: result.initializationMs,
  reachableSchemas: result.reachableSchemas,
  rssDelta: result.afterInit.rss - result.beforeInit.rss,
  schemaClones: result.schemaClones,
  schemaConstructors: result.schemaConstructors,
})

try {
  run()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exitCode = 1
}
