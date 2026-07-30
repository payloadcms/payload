/* eslint-disable no-console */
import type { Config, Field } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { performance } from 'node:perf_hooks'
import { parseArgs } from 'node:util'
import { deepCopyObject, sanitizeConfig } from 'payload'

import { baseConfig } from '../baseConfig.js'

const DEFAULT_COPIES = 25
const DEFAULT_ITERATIONS = 5
const DEFAULT_WARMUPS = 1

type BenchmarkOptions = {
  copies: number
  iterations: number
  warmups: number
}

type BenchmarkSummary = {
  maxMs: number
  meanMs: number
  minMs: number
  p50Ms: number
  p95Ms: number
  standardDeviationMs: number
}

const options = getBenchmarkOptions()
const fixtureStats = getFixtureStats({ copies: options.copies })

console.log('Config sanitization benchmark')
console.log(`  Fields suite copies: ${options.copies}`)
console.log(`  Input collections: ${fixtureStats.collections.toLocaleString()}`)
console.log(`  Input field definitions: ${fixtureStats.fields.toLocaleString()}`)
console.log(`  Warmups: ${options.warmups}`)
console.log(`  Measured iterations: ${options.iterations}`)

for (let iteration = 0; iteration < options.warmups; iteration++) {
  const duration = runIteration({ copies: options.copies })

  console.log(`  Warmup ${iteration + 1}/${options.warmups}: ${formatMilliseconds(duration)}`)
}

const durations: number[] = []

for (let iteration = 0; iteration < options.iterations; iteration++) {
  const duration = runIteration({ copies: options.copies })

  durations.push(duration)
  console.log(`  Iteration ${iteration + 1}/${options.iterations}: ${formatMilliseconds(duration)}`)
}

const summary = summarizeDurations({ durations })

console.log('\nResults')
console.log(`  Mean: ${formatMilliseconds(summary.meanMs)}`)
console.log(`  Min: ${formatMilliseconds(summary.minMs)}`)
console.log(`  P50: ${formatMilliseconds(summary.p50Ms)}`)
console.log(`  P95: ${formatMilliseconds(summary.p95Ms)}`)
console.log(`  Max: ${formatMilliseconds(summary.maxMs)}`)
console.log(`  Standard deviation: ${formatMilliseconds(summary.standardDeviationMs)}`)
console.log(`  Throughput: ${(1000 / summary.meanMs).toFixed(2)} sanitizations/second`)

function runIteration({ copies }: { copies: number }): number {
  const config = createHugeFieldsConfig({ copies })
  const inputCollectionCount = config.collections!.length
  const start = performance.now()
  const sanitizedConfig = sanitizeConfig(config)
  const duration = performance.now() - start

  if (sanitizedConfig.collections.length < inputCollectionCount) {
    throw new Error('Sanitized config is missing input collections')
  }

  return duration
}

function createHugeFieldsConfig({ copies }: { copies: number }): Config {
  const config = deepCopyObject(baseConfig)
  const sourceCollections = config.collections ?? []
  const collections = [...sourceCollections]

  for (let copyIndex = 1; copyIndex < copies; copyIndex++) {
    collections.push(
      ...sourceCollections.map((sourceCollection) => {
        const collection = deepCopyObject(sourceCollection)

        collection.slug = `${sourceCollection.slug}-benchmark-${copyIndex}`

        return collection
      }),
    )
  }

  return {
    ...config,
    collections,
    db: {} as Config['db'],
    editor: lexicalEditor({}),
    secret: 'config-sanitization-benchmark',
  }
}

function getBenchmarkOptions(): BenchmarkOptions {
  const { values } = parseArgs({
    options: {
      copies: {
        type: 'string',
        default: String(DEFAULT_COPIES),
      },
      iterations: {
        type: 'string',
        default: String(DEFAULT_ITERATIONS),
        short: 'i',
      },
      warmups: {
        type: 'string',
        default: String(DEFAULT_WARMUPS),
        short: 'w',
      },
    },
    strict: true,
  })

  return {
    copies: parseInteger({ name: 'copies', minimum: 1, value: values.copies }),
    iterations: parseInteger({ name: 'iterations', minimum: 1, value: values.iterations }),
    warmups: parseInteger({ name: 'warmups', minimum: 0, value: values.warmups }),
  }
}

function getFixtureStats({ copies }: { copies: number }): {
  collections: number
  fields: number
} {
  const collectionFields =
    baseConfig.collections?.reduce(
      (total, collection) => total + countFields({ fields: collection.fields }),
      0,
    ) ?? 0
  const configBlockFields =
    baseConfig.blocks?.reduce((total, block) => total + countFields({ fields: block.fields }), 0) ??
    0
  const globalFields =
    baseConfig.globals?.reduce(
      (total, global) => total + countFields({ fields: global.fields }),
      0,
    ) ?? 0

  return {
    collections: (baseConfig.collections?.length ?? 0) * copies,
    fields: collectionFields * copies + configBlockFields + globalFields,
  }
}

function countFields({ fields }: { fields: Field[] }): number {
  let count = fields.length

  for (const field of fields) {
    if ('fields' in field && field.fields) {
      count += countFields({ fields: field.fields })
    }

    if (field.type === 'blocks' && field.blocks) {
      for (const block of field.blocks) {
        if (typeof block !== 'string') {
          count += countFields({ fields: block.fields })
        }
      }
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        count += countFields({ fields: tab.fields })
      }
    }
  }

  return count
}

function parseInteger({
  name,
  minimum,
  value,
}: {
  minimum: number
  name: string
  value: string | undefined
}): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`--${name} must be an integer greater than or equal to ${minimum}`)
  }

  return parsed
}

function summarizeDurations({ durations }: { durations: number[] }): BenchmarkSummary {
  const sorted = [...durations].sort((a, b) => a - b)
  const meanMs = durations.reduce((total, duration) => total + duration, 0) / durations.length
  const variance =
    durations.reduce((total, duration) => total + (duration - meanMs) ** 2, 0) / durations.length

  return {
    maxMs: sorted.at(-1)!,
    meanMs,
    minMs: sorted[0]!,
    p50Ms: percentile({ percentile: 0.5, sortedValues: sorted }),
    p95Ms: percentile({ percentile: 0.95, sortedValues: sorted }),
    standardDeviationMs: Math.sqrt(variance),
  }
}

function percentile({
  percentile,
  sortedValues,
}: {
  percentile: number
  sortedValues: number[]
}): number {
  return sortedValues[Math.ceil(percentile * sortedValues.length) - 1]!
}

function formatMilliseconds(duration: number): string {
  return `${duration.toFixed(2)} ms`
}
