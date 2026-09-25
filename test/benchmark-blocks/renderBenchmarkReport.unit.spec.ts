import { describe, expect, test } from 'vitest'

import type { BenchmarkSample } from './benchmarkReport.js'
import type { WorkerResult } from './measureSchemas.worker.js'
import type { StoredAttributionRun, StoredBenchmarkRun } from './renderBenchmarkReport.js'
import type { BenchmarkScenarioName } from './schemaScenarios.js'

import { renderBenchmarkReport } from './renderBenchmarkReport.js'

const environment = {
  architecture: 'arm64',
  gitRevision: 'test-revision',
  mongooseVersion: '9.9.2',
  nodeVersion: 'v24.15.0',
  operatingSystem: 'test-os',
  payloadVersion: '4.0.0',
}

const emptyMemoryUsage: NodeJS.MemoryUsage = {
  arrayBuffers: 0,
  external: 0,
  heapTotal: 0,
  heapUsed: 0,
  rss: 0,
}

describe('renderBenchmarkReport', () => {
  test('should derive explanatory text from the supplied benchmark results', () => {
    const before = createStoredRun({
      'inline-control': createSample({ heapUsedDelta: 200, initializationMs: 100 }),
      minimal: createSample({ heapUsedDelta: 100, initializationMs: 50 }),
      'wide-references': createSample({
        heapUsedDelta: 1_000,
        reachableSchemas: 500,
        schemaConstructors: 1_000,
      }),
    })
    const after = createStoredRun({
      'inline-control': createSample({ heapUsedDelta: 206, initializationMs: 106 }),
      minimal: createSample({ heapUsedDelta: 100, initializationMs: 50 }),
      'wide-references': createSample({
        heapUsedDelta: 500,
        reachableSchemas: 500,
        schemaClones: 100,
        schemaConstructors: 110,
      }),
    })
    const attribution: StoredAttributionRun = {
      environment,
      scenarios: {
        'nested-diamond': {
          cache: { entries: [], hits: 0, misses: 0 },
          descriptors: [
            {
              discriminators: [],
              indexes: [],
              label: 'block:root',
              options: {},
              paths: {},
              reachableSchemaCount: 1,
              variantKey: 'default',
            },
          ],
          environment,
          scenario: 'nested-diamond',
        },
      },
    }

    const report = renderBenchmarkReport({
      after,
      afterDigest: 'after-digest',
      attribution,
      attributionDigest: 'attribution-digest',
      before,
      beforeDigest: 'before-digest',
    })

    expect(report).toContain('100 remaining calls are required discriminator attachments')
    expect(report).toContain('The inline control exceeds the 5% guardrail')
    expect(report).not.toContain('48,000 remaining calls')
    expect(report).not.toContain('timing ranges each contain one extreme elapsed-time outlier')
  })
})

const createSample = (overrides: Partial<BenchmarkSample>): BenchmarkSample => ({
  externalDelta: 0,
  heapTotalDelta: 0,
  heapUsedDelta: 0,
  initializationMs: 0,
  reachableSchemas: 0,
  rssDelta: 0,
  schemaClones: 0,
  schemaConstructors: 0,
  ...overrides,
})

const createStoredRun = (
  samples: Partial<Record<BenchmarkScenarioName, BenchmarkSample>>,
): StoredBenchmarkRun => ({
  environment,
  iterations: 1,
  rawResults: Object.fromEntries(
    Object.entries(samples).map(([scenario, sample]) => [
      scenario,
      [createWorkerResult({ sample, scenario: scenario as BenchmarkScenarioName })],
    ]),
  ),
  scenarios: Object.fromEntries(
    Object.entries(samples).map(([scenario, sample]) => [scenario, [sample]]),
  ),
})

const createWorkerResult = ({
  sample,
  scenario,
}: {
  sample: BenchmarkSample
  scenario: BenchmarkScenarioName
}): WorkerResult => ({
  afterDestroy: emptyMemoryUsage,
  afterInit: {
    ...emptyMemoryUsage,
    external: sample.externalDelta,
    heapTotal: sample.heapTotalDelta,
    heapUsed: sample.heapUsedDelta,
    rss: sample.rssDelta,
  },
  attribution: {
    'array-group-tab': 0,
    'blocks-base': 0,
    'discriminator-clone': 0,
    'mongoose-internal': 0,
    'top-level': 0,
  },
  beforeInit: emptyMemoryUsage,
  environment,
  initializationMs: sample.initializationMs,
  reachableSchemas: sample.reachableSchemas,
  scenario,
  schemaClones: sample.schemaClones,
  schemaConstructors: sample.schemaConstructors,
})
