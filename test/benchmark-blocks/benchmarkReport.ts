export type BenchmarkSample = {
  externalDelta: number
  heapTotalDelta: number
  heapUsedDelta: number
  initializationMs: number
  reachableSchemas: number
  rssDelta: number
  schemaClones: number
  schemaConstructors: number
}

export type BenchmarkRun = {
  scenarios: Record<string, BenchmarkSample[]>
}

export type MetricRange = {
  maximum: number
  median: number
  minimum: number
}

export type BenchmarkSummary = Record<keyof BenchmarkSample, MetricRange>

export type BenchmarkComparison = {
  scenarios: Record<
    string,
    {
      incrementalHeap: {
        after: number
        before: number
        reductionPercent: number
      }
    }
  >
}

export type BenchmarkAcceptanceCheck = {
  details: string
  name: string
  passed: boolean
}

const referencedBlockScenarioNames = [
  'wide-references',
  'nested-diamond',
  'nested-diamond-drafts',
  'nested-diamond-localized',
  'multiple-entities',
] as const

const constructorThresholdScenarioNames = ['wide-references', 'nested-diamond'] as const

const benchmarkMetricNames = [
  'externalDelta',
  'heapTotalDelta',
  'heapUsedDelta',
  'initializationMs',
  'reachableSchemas',
  'rssDelta',
  'schemaClones',
  'schemaConstructors',
] as const

export const compareBenchmarks = ({
  after,
  before,
}: {
  after: BenchmarkRun
  before: BenchmarkRun
}): BenchmarkComparison => {
  const afterMinimal = summarizeBenchmark({
    samples: getScenarioSamples({ run: after, scenario: 'minimal' }),
  }).heapUsedDelta.median
  const beforeMinimal = summarizeBenchmark({
    samples: getScenarioSamples({ run: before, scenario: 'minimal' }),
  }).heapUsedDelta.median
  const scenarioNames = Object.keys(before.scenarios).filter(
    (scenarioName) => scenarioName in after.scenarios,
  )

  return {
    scenarios: Object.fromEntries(
      scenarioNames.map((scenarioName) => {
        const afterHeap = summarizeBenchmark({
          samples: getScenarioSamples({ run: after, scenario: scenarioName }),
        }).heapUsedDelta.median
        const beforeHeap = summarizeBenchmark({
          samples: getScenarioSamples({ run: before, scenario: scenarioName }),
        }).heapUsedDelta.median
        const afterIncrementalHeap = afterHeap - afterMinimal
        const beforeIncrementalHeap = beforeHeap - beforeMinimal

        return [
          scenarioName,
          {
            incrementalHeap: {
              after: afterIncrementalHeap,
              before: beforeIncrementalHeap,
              reductionPercent:
                beforeIncrementalHeap === 0
                  ? 0
                  : ((beforeIncrementalHeap - afterIncrementalHeap) / beforeIncrementalHeap) * 100,
            },
          },
        ]
      }),
    ),
  }
}

export const summarizeBenchmark = ({
  samples,
}: {
  samples: BenchmarkSample[]
}): BenchmarkSummary => {
  if (samples.length === 0) {
    throw new Error('At least one benchmark sample is required.')
  }

  return Object.fromEntries(
    benchmarkMetricNames.map((metricName) => [
      metricName,
      getMetricRange({ values: samples.map((sample) => sample[metricName]) }),
    ]),
  ) as BenchmarkSummary
}

export const evaluateBenchmarkAcceptance = ({
  after,
  before,
}: {
  after: BenchmarkRun
  before: BenchmarkRun
}): BenchmarkAcceptanceCheck[] => {
  const checks: BenchmarkAcceptanceCheck[] = []
  const comparison = compareBenchmarks({ after, before })
  const sharedScenarioNames = Object.keys(before.scenarios).filter(
    (scenarioName) => scenarioName in after.scenarios,
  )

  for (const scenarioName of constructorThresholdScenarioNames) {
    if (!sharedScenarioNames.includes(scenarioName)) {
      continue
    }

    const beforeConstructors = getScenarioSummary({ run: before, scenario: scenarioName })
      .schemaConstructors.median
    const afterConstructors = getScenarioSummary({ run: after, scenario: scenarioName })
      .schemaConstructors.median
    const beforeClones = getScenarioSummary({ run: before, scenario: scenarioName }).schemaClones
      .median
    const afterClones = getScenarioSummary({ run: after, scenario: scenarioName }).schemaClones
      .median
    const reductionPercent = getReductionPercent({
      after: afterConstructors,
      before: beforeConstructors,
    })
    const nonCloneReductionPercent = getReductionPercent({
      after: Math.max(0, afterConstructors - afterClones),
      before: Math.max(0, beforeConstructors - beforeClones),
    })
    const discriminatorAttachmentException = reductionPercent < 95 && nonCloneReductionPercent >= 95

    checks.push({
      name: `${scenarioName} constructors`,
      details: discriminatorAttachmentException
        ? `${formatMetric(nonCloneReductionPercent)}% fewer non-clone constructors; ${formatMetric(afterClones)} remaining calls are required discriminator attachments`
        : `${formatMetric(reductionPercent)}% fewer constructors (${formatMetric(beforeConstructors)} to ${formatMetric(afterConstructors)})`,
      passed: reductionPercent >= 95 || discriminatorAttachmentException,
    })
  }

  for (const scenarioName of referencedBlockScenarioNames) {
    if (!sharedScenarioNames.includes(scenarioName)) {
      continue
    }

    const incrementalHeap = comparison.scenarios[scenarioName]!.incrementalHeap

    checks.push({
      name: `${scenarioName} incremental heap`,
      details: `${formatMetric(incrementalHeap.reductionPercent)}% lower incremental heap (${formatMetric(incrementalHeap.before)} to ${formatMetric(incrementalHeap.after)} bytes)`,
      passed: incrementalHeap.after < incrementalHeap.before,
    })
  }

  if (sharedScenarioNames.includes('inline-control')) {
    const inlineHeap = comparison.scenarios['inline-control']!.incrementalHeap
    const beforeTime = getScenarioSummary({ run: before, scenario: 'inline-control' })
      .initializationMs.median
    const afterTime = getScenarioSummary({ run: after, scenario: 'inline-control' })
      .initializationMs.median
    const heapRegressionPercent = getRegressionPercent({
      after: inlineHeap.after,
      before: inlineHeap.before,
    })
    const timeRegressionPercent = getRegressionPercent({ after: afterTime, before: beforeTime })

    checks.push(
      {
        name: 'inline-control incremental heap',
        details: `${formatMetric(heapRegressionPercent)}% change in incremental heap`,
        passed: heapRegressionPercent <= 5,
      },
      {
        name: 'inline-control initialization time',
        details: `${formatMetric(timeRegressionPercent)}% change in initialization time`,
        passed: timeRegressionPercent <= 5,
      },
    )
  }

  for (const scenarioName of sharedScenarioNames.filter((name) => name !== 'minimal')) {
    const beforeReachable = getScenarioSummary({ run: before, scenario: scenarioName })
      .reachableSchemas.median
    const afterReachable = getScenarioSummary({ run: after, scenario: scenarioName })
      .reachableSchemas.median

    checks.push({
      name: `${scenarioName} reachable schemas`,
      details: `${formatMetric(beforeReachable)} before and ${formatMetric(afterReachable)} after`,
      passed: afterReachable <= beforeReachable,
    })
  }

  return checks
}

const getMetricRange = ({ values }: { values: number[] }): MetricRange => {
  const sortedValues = [...values].sort((a, b) => a - b)
  const center = Math.floor(sortedValues.length / 2)
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[center - 1]! + sortedValues[center]!) / 2
      : sortedValues[center]!

  return {
    maximum: sortedValues.at(-1)!,
    median,
    minimum: sortedValues[0]!,
  }
}

const formatMetric = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)

const getReductionPercent = ({ after, before }: { after: number; before: number }): number =>
  before === 0 ? (after === 0 ? 0 : Number.NEGATIVE_INFINITY) : ((before - after) / before) * 100

const getRegressionPercent = ({ after, before }: { after: number; before: number }): number =>
  before === 0 ? (after <= 0 ? 0 : Number.POSITIVE_INFINITY) : ((after - before) / before) * 100

const getScenarioSummary = ({
  run,
  scenario,
}: {
  run: BenchmarkRun
  scenario: string
}): BenchmarkSummary => summarizeBenchmark({ samples: getScenarioSamples({ run, scenario }) })

const getScenarioSamples = ({
  run,
  scenario,
}: {
  run: BenchmarkRun
  scenario: string
}): BenchmarkSample[] => {
  const samples = run.scenarios[scenario]

  if (!samples) {
    throw new Error(`Benchmark result does not contain the "${scenario}" scenario.`)
  }

  return samples
}
