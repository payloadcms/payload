import type { Schema } from 'mongoose'

import mongoose from 'mongoose'
import { describe, expect, test } from 'vitest'

import type { BenchmarkRun, BenchmarkSample } from './benchmarkReport.js'

import {
  compareBenchmarks,
  evaluateBenchmarkAcceptance,
  summarizeBenchmark,
} from './benchmarkReport.js'
import { countUniqueReachableSchemas, describeMongooseSchema } from './describeMongooseSchema.js'
import { createMeasuredSchemaBuildContext } from './measuredSchemaBuildContext.js'

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
  test('should keep cache metrics in a benchmark-only wrapper', () => {
    const { context, snapshot } = createMeasuredSchemaBuildContext<object>()
    const definition = {}

    context.getOrCreate({
      build: () => ({}),
      cacheKey: 'block:hero|live',
      definition,
    })
    context.getOrCreate({
      build: () => ({}),
      cacheKey: 'block:hero|live',
      definition,
    })

    expect(context).not.toHaveProperty('snapshot')
    expect(snapshot()).toEqual({
      entries: [{ hits: 1, label: 'block:hero', misses: 1, variantKey: 'live' }],
      hits: 1,
      misses: 1,
    })
  })

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

  test('should evaluate the benchmark acceptance thresholds from medians', () => {
    const before: BenchmarkRun = {
      scenarios: {
        'inline-control': [
          createSample({
            heapUsedDelta: 300,
            initializationMs: 200,
            reachableSchemas: 100,
            schemaConstructors: 100,
          }),
        ],
        minimal: [
          createSample({ heapUsedDelta: 100, initializationMs: 100, reachableSchemas: 10 }),
        ],
        'nested-diamond': [
          createSample({
            heapUsedDelta: 1_100,
            initializationMs: 1_000,
            reachableSchemas: 1_000,
            schemaConstructors: 10_000,
          }),
        ],
      },
    }
    const after: BenchmarkRun = {
      scenarios: {
        'inline-control': [
          createSample({
            heapUsedDelta: 310,
            initializationMs: 205,
            reachableSchemas: 100,
            schemaConstructors: 100,
          }),
        ],
        minimal: [
          createSample({ heapUsedDelta: 110, initializationMs: 100, reachableSchemas: 10 }),
        ],
        'nested-diamond': [
          createSample({
            heapUsedDelta: 210,
            initializationMs: 100,
            reachableSchemas: 100,
            schemaConstructors: 400,
          }),
        ],
      },
    }

    const checks = evaluateBenchmarkAcceptance({ after, before })

    expect(checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'nested-diamond constructors', passed: true }),
        expect.objectContaining({ name: 'nested-diamond incremental heap', passed: true }),
        expect.objectContaining({ name: 'inline-control incremental heap', passed: true }),
        expect.objectContaining({ name: 'inline-control initialization time', passed: true }),
        expect.objectContaining({ name: 'nested-diamond reachable schemas', passed: true }),
      ]),
    )
  })

  test('should fail an inline control regression greater than five percent', () => {
    const before: BenchmarkRun = {
      scenarios: {
        'inline-control': [createSample({ heapUsedDelta: 200, initializationMs: 200 })],
        minimal: [createSample({ heapUsedDelta: 100, initializationMs: 100 })],
      },
    }
    const after: BenchmarkRun = {
      scenarios: {
        'inline-control': [createSample({ heapUsedDelta: 120, initializationMs: 220 })],
        minimal: [createSample({ heapUsedDelta: 100, initializationMs: 100 })],
      },
    }

    const checks = evaluateBenchmarkAcceptance({ after, before })

    expect(checks.find(({ name }) => name === 'inline-control initialization time')?.passed).toBe(
      false,
    )
  })

  test('should accept remaining constructor calls when they are discriminator clones', () => {
    const before: BenchmarkRun = {
      scenarios: {
        minimal: [createSample({ heapUsedDelta: 100 })],
        'wide-references': [
          createSample({
            heapUsedDelta: 1_000,
            reachableSchemas: 5_000,
            schemaClones: 4_800,
            schemaConstructors: 10_000,
          }),
        ],
      },
    }
    const after: BenchmarkRun = {
      scenarios: {
        minimal: [createSample({ heapUsedDelta: 100 })],
        'wide-references': [
          createSample({
            heapUsedDelta: 500,
            reachableSchemas: 5_000,
            schemaClones: 4_800,
            schemaConstructors: 5_000,
          }),
        ],
      },
    }

    const constructorCheck = evaluateBenchmarkAcceptance({ after, before }).find(
      ({ name }) => name === 'wide-references constructors',
    )

    expect(constructorCheck).toMatchObject({ passed: true })
    expect(constructorCheck?.details).toContain('discriminator attachments')
  })
})
