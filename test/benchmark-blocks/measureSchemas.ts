import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import type { BenchmarkRun, BenchmarkSample } from './benchmarkReport.js'
import type { WorkerResult } from './measureSchemas.worker.js'
import type { BenchmarkScenarioName } from './schemaScenarios.js'

import { compareBenchmarks, summarizeBenchmark } from './benchmarkReport.js'
import { benchmarkScenarioNames, isBenchmarkScenarioName } from './schemaScenarios.js'

type StoredBenchmarkRun = {
  environment: WorkerResult['environment']
  iterations: number
  rawResults: Record<string, WorkerResult[]>
} & BenchmarkRun

const workerPath = fileURLToPath(new URL('./measureSchemas.worker.ts', import.meta.url))

const run = (): void => {
  const arguments_ = process.argv.slice(2).filter((argument) => argument !== '--')
  const compareIndex = arguments_.indexOf('--compare')

  if (compareIndex !== -1) {
    const beforePath = arguments_[compareIndex + 1]
    const afterPath = arguments_[compareIndex + 2]
    const markdownPath = getOption({ name: '--markdown', arguments_ })

    if (!beforePath || !afterPath || !markdownPath) {
      throw new Error('--compare requires before and after files plus --markdown.')
    }

    const before = readRun({ path: beforePath })
    const after = readRun({ path: afterPath })
    writeFileSync(markdownPath, renderComparison({ after, before }), 'utf8')
    process.stderr.write(`Wrote ${markdownPath}\n`)
    return
  }

  const outputPath = getOption({ name: '--output', arguments_ })
  const requestedScenario = getOption({ name: '--scenario', arguments_ })
  const iterations = Number(getOption({ name: '--iterations', arguments_ }) ?? '1')

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

const formatBytes = (value: number): string => `${(value / 1024 / 1024).toFixed(1)} MiB`

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)

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

const renderComparison = ({
  after,
  before,
}: {
  after: StoredBenchmarkRun
  before: StoredBenchmarkRun
}): string => {
  const comparison = compareBenchmarks({ after, before })
  const rows = benchmarkScenarioNames
    .filter((scenario) => before.scenarios[scenario] && after.scenarios[scenario])
    .map((scenario) => {
      const beforeSummary = summarizeBenchmark({ samples: before.scenarios[scenario]! })
      const afterSummary = summarizeBenchmark({ samples: after.scenarios[scenario]! })
      const incrementalHeap = comparison.scenarios[scenario]!.incrementalHeap

      return `| ${scenario} | ${formatBytes(beforeSummary.rssDelta.median)} | ${formatBytes(afterSummary.rssDelta.median)} | ${formatBytes(beforeSummary.heapUsedDelta.median)} | ${formatBytes(afterSummary.heapUsedDelta.median)} | ${formatNumber(beforeSummary.initializationMs.median)} ms | ${formatNumber(afterSummary.initializationMs.median)} ms | ${formatNumber(beforeSummary.schemaConstructors.median)} | ${formatNumber(afterSummary.schemaConstructors.median)} | ${formatNumber(beforeSummary.schemaClones.median)} | ${formatNumber(afterSummary.schemaClones.median)} | ${formatNumber(beforeSummary.reachableSchemas.median)} | ${formatNumber(afterSummary.reachableSchemas.median)} | ${formatNumber(incrementalHeap.reductionPercent)}% |`
    })

  return `# MongoDB Schema Build Cache Benchmarks

**Written with AI**

## Environment

- Before revision: \`${before.environment.gitRevision}\`
- After revision: \`${after.environment.gitRevision}\`
- Node.js: ${after.environment.nodeVersion}
- Mongoose: ${after.environment.mongooseVersion}
- Payload: ${after.environment.payloadVersion}
- Platform: ${after.environment.operatingSystem} (${after.environment.architecture})
- Repetitions: ${after.iterations}

## Results

| Scenario | RSS before | RSS after | Heap before | Heap after | Init before | Init after | Constructors before | Constructors after | Clones before | Clones after | Reachable before | Reachable after | Incremental heap reduction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}

RSS is supporting evidence because allocator behavior can vary. Heap deltas, schema construction counts, and compiled reachable-schema counts provide the primary comparison.
`
}

const runWorker = ({ scenario }: { scenario: BenchmarkScenarioName }): WorkerResult => {
  const result = spawnSync(
    process.execPath,
    ['--expose-gc', '--no-deprecation', '--import', 'tsx', workerPath, scenario],
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
    return JSON.parse(result.stdout.trim()) as WorkerResult
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
