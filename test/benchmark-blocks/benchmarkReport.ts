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
