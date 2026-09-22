import type { Schema } from 'mongoose'

import mongoose from 'mongoose'
import { describe, expect, test } from 'vitest'

import type { BenchmarkRun, BenchmarkSample } from './benchmarkReport.js'

import { compareBenchmarks, summarizeBenchmark } from './benchmarkReport.js'
import { countUniqueReachableSchemas, describeMongooseSchema } from './describeMongooseSchema.js'

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

const createRun = ({
  minimalHeap,
  nestedHeap,
}: {
  minimalHeap: number
  nestedHeap: number
}): BenchmarkRun => ({
  scenarios: {
    minimal: [createSample({ heapUsedDelta: minimalHeap })],
    'nested-diamond': [createSample({ heapUsedDelta: nestedHeap })],
  },
})

describe('MongoDB schema benchmark helpers', () => {
  test('should calculate median, minimum, and maximum without averaging outliers', () => {
    const samples = [
      createSample({ heapUsedDelta: 10, initializationMs: 10, schemaConstructors: 10 }),
      createSample({ heapUsedDelta: 20, initializationMs: 20, schemaConstructors: 20 }),
      createSample({
        heapUsedDelta: 1_000,
        initializationMs: 1_000,
        schemaConstructors: 1_000,
      }),
    ]

    const summary = summarizeBenchmark({ samples })

    expect(summary.heapUsedDelta).toEqual({ maximum: 1_000, median: 20, minimum: 10 })
    expect(summary.schemaConstructors.median).toBe(20)
    expect(samples.map(({ heapUsedDelta }) => heapUsedDelta)).toEqual([10, 20, 1_000])
  })

  test('should reject an empty sample set', () => {
    expect(() => summarizeBenchmark({ samples: [] })).toThrow(
      'At least one benchmark sample is required.',
    )
  })

  test('should subtract each revision minimal scenario before comparing graph cost', () => {
    const comparison = compareBenchmarks({
      after: createRun({ minimalHeap: 150, nestedHeap: 250 }),
      before: createRun({ minimalHeap: 100, nestedHeap: 500 }),
    })

    expect(comparison.scenarios['nested-diamond']?.incrementalHeap.before).toBe(400)
    expect(comparison.scenarios['nested-diamond']?.incrementalHeap.after).toBe(100)
    expect(comparison.scenarios['nested-diamond']?.incrementalHeap.reductionPercent).toBe(75)
  })

  test('should describe paths, indexes, options, discriminators, and reachable schemas', () => {
    const child = new mongoose.Schema({ title: { type: String, index: true } }, { _id: false })
    const parent = new mongoose.Schema(
      { items: [new mongoose.Schema({}, { discriminatorKey: 'blockType' })] },
      { minimize: false },
    )

    ;(
      parent.path('items') as unknown as { discriminator: (name: string, schema: Schema) => void }
    ).discriminator('text', child)

    const descriptor = describeMongooseSchema({
      label: 'fixture',
      schema: parent,
      variantKey: 'test',
    })

    expect(descriptor.paths.items?.instance).toBe('Array')
    expect(descriptor.discriminators).toContain('items:text')
    expect(descriptor.options.minimize).toBe(false)
    expect(descriptor.reachableSchemaCount).toBeGreaterThan(1)
  })

  test('should count a shared child schema once across compiled model roots', () => {
    const sharedChild = new mongoose.Schema({ title: String })
    const first = new mongoose.Schema({ child: sharedChild })
    const second = new mongoose.Schema({ child: sharedChild })

    expect(countUniqueReachableSchemas({ schemas: [first, second] })).toBe(3)
  })
})
