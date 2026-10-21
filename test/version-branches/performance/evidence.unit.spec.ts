import { expect, test } from 'vitest'

import {
  hasFinalPerformanceSamples,
  renderNativeEvidence,
  summarizeNativePlan,
} from './evidence.mjs'

test('should refuse final approval when any scalar or graph layer lacks forty retained samples', () => {
  const methods = [
    'current-drafts-native',
    'branch-native',
    'branch-guarded-core',
    'published-native',
  ]
  const workloads = ['selective', 'range', 'relationship', 'nested', 'locale']
  const measurement = () => ({ iterations: 40, samples: Array.from({ length: 40 }, () => 1) })
  const report = {
    gate: workloads.map((workload) => ({ workload })),
    measurements: workloads.flatMap((workload) =>
      methods.map((method) => ({ workload, method, ...measurement() })),
    ),
    graph: {
      measurements: ['current-drafts-native-raw-graph', 'branch-guarded-core-raw-graph'].map(
        (method) => ({ method, ...measurement() }),
      ),
    },
  }

  expect(hasFinalPerformanceSamples({ report })).toBe(true)
  report.graph.measurements[1]!.iterations = 1
  report.graph.measurements[1]!.samples = [1]
  expect(hasFinalPerformanceSamples({ report })).toBe(false)
  report.graph.measurements[1] = { method: 'branch-guarded-core-raw-graph', ...measurement() }
  report.measurements[0]!.samples.pop()
  expect(hasFinalPerformanceSamples({ report })).toBe(false)
})

test('should retain separate executed Mongo counters without rejected plan or nested stage double counting', () => {
  const summary = summarizeNativePlan({
    adapter: 'mongodb',
    explanation: {
      stages: [
        {
          $cursor: {
            executionStats: { totalDocsExamined: 12, totalKeysExamined: 15, nReturned: 8 },
            queryPlanner: {
              winningPlan: {
                stage: 'FETCH',
                inputStage: { stage: 'IXSCAN', indexName: 'actual-index' },
              },
              rejectedPlans: [{ stage: 'COLLSCAN', indexName: 'rejected-index' }],
            },
          },
        },
        {
          $lookup: { from: 'targets' },
          totalDocsExamined: 4,
          totalKeysExamined: 6,
          collectionScans: 0,
          indexesUsed: ['target-index'],
        },
      ],
    },
  }).join('\n')

  expect(summary).toContain('docs examined 12, keys examined 15')
  expect(summary).toContain('docs examined 4, keys examined 6')
  expect(summary).toContain('FETCH, IXSCAN')
  expect(summary).not.toContain('rejected-index')
  expect(summary).not.toContain('COLLSCAN')
  expect(summary).toContain('are not summed')
})

test('should report PostgreSQL per-loop scan rows and missing counters without inventing totals', () => {
  const summary = summarizeNativePlan({
    adapter: 'postgres',
    explanation: [
      {
        'QUERY PLAN': [
          {
            Plan: {
              'Node Type': 'Nested Loop',
              'Actual Rows': 20,
              'Actual Loops': 1,
              'Shared Hit Blocks': 55,
              Plans: [
                {
                  'Node Type': 'Index Scan',
                  'Relation Name': 'cache',
                  'Index Name': 'cache-id',
                  'Actual Rows': 2,
                  'Actual Loops': 20,
                },
              ],
            },
          },
        ],
      },
    ],
  }).join('\n')

  expect(summary).toContain('rows/loop 2, loops 20')
  expect(summary).toContain('55/unavailable')
  expect(summary).toContain('not an additive rows-examined total')
  expect(summary).not.toContain('rows/loop 40')
})

test('should publish SQLite index choices while marking runtime rows examined unavailable', () => {
  const summary = summarizeNativePlan({
    adapter: 'sqlite',
    explanation: [
      { detail: 'SEARCH cache USING INDEX cache_id (id=?)' },
      { detail: 'USE TEMP B-TREE FOR ORDER BY' },
    ],
  }).join('\n')

  expect(summary).toContain('Actual rows examined: unavailable')
  expect(summary).toContain('SEARCH cache USING INDEX cache_id')
  expect(summary).toContain('TEMP B-TREE')
})

test('should segregate historical diagnostics and reject mismatched or changed-source final representatives', () => {
  const report = {
    scenario: { documents: 10000, branches: 1, locales: 2 },
    environment: { evidence: 'final', sourceDigest: { value: 'old' }, isSourceUnchanged: true },
    measurements: [],
  }
  const summary = renderNativeEvidence({
    sourceDigest: 'current',
    entries: [
      { key: 'mongodb-10000-2-1-0.01', evidence: 'final', report, reportSHA256: 'old-report' },
      {
        key: 'postgres-10000-2-1-0.01',
        evidence: 'final',
        report: {
          ...report,
          environment: {
            ...report.environment,
            sourceDigest: { value: 'current' },
            isSourceUnchanged: false,
          },
        },
        reportSHA256: 'changed-report',
      },
      {
        key: 'sqlite-10000-2-1-0.01',
        evidence: 'diagnostic',
        report: { ...report, environment: {}, error: { message: 'Captured budget failure' } },
        reportSHA256: 'diagnostic-report',
      },
    ],
  })

  expect(summary.startsWith('Written with AI\n')).toBe(true)
  expect(summary).not.toContain('old-report')
  expect(summary).not.toContain('changed-report')
  expect(summary).toContain('historical diagnostic; never final coverage')
  expect(summary).toContain('Captured budget failure')
  expect(summary).toContain('unavailable (predates source pinning)')
})
