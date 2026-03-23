/**
 * Exploratory benchmark only — not run in CI. Set PATCH_PERF=1 (see `pnpm test:patch-perf`).
 * Safe to remove this directory when the partial-save demo is no longer needed.
 */
import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { reduceFieldsToValues, reduceModifiedFieldsToValues } from 'payload/shared'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, expect, describe as vitestDescribe, it as vitestIt } from 'vitest'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import {
  ALL_SCENARIOS,
  buildFormStateForShape,
  buildPartialUpdate,
  buildSeedData,
  type CollectionShape,
  type EditScenario,
  generateAllShapes,
  TAGS_SLUG,
} from './generate.js'
import {
  COLLECTION_COUNT,
  REDUCER_ITERATIONS,
  UPDATE_COLLECTIONS,
  UPDATE_ITERATIONS,
} from './shared.js'

const RUN = Boolean(process.env.PATCH_PERF)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const resultsDir = path.join(dirname, 'results')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function utf8Bytes(v: unknown): number {
  return Buffer.byteLength(JSON.stringify(v), 'utf8')
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function p50(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

function p95(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length * 0.95)]!
}

function buildSaveMetrics(rows: UpdateRow[], updateIterations: number): SaveMetricsFile {
  const byScenario = {} as SaveMetricsFile['byScenario']

  for (const scenario of ALL_SCENARIOS) {
    const subset = rows.filter((r) => r.scenario === scenario)
    if (subset.length === 0) {
      continue
    }

    const n = subset.length

    byScenario[scenario] = {
      collectionsSampled: n,
      meanFullMs: subset.reduce((s, r) => s + r.fullMsMean, 0) / n,
      meanFullPayloadBytes: subset.reduce((s, r) => s + r.fullPayloadBytesMean, 0) / n,
      meanPartialMs: subset.reduce((s, r) => s + r.partialMsMean, 0) / n,
      meanPartialPayloadBytes: subset.reduce((s, r) => s + r.partialPayloadBytesMean, 0) / n,
      meanPayloadSavingsPercent: subset.reduce((s, r) => s + r.payloadSavingsPercent, 0) / n,
      meanUpdateSpeedupRatio: subset.reduce((s, r) => s + r.updateSpeedupRatio, 0) / n,
      updateIterationsPerCell: updateIterations,
    }
  }

  const typicalScenarios = ALL_SCENARIOS.filter((s) => s !== 'all_fields')
  const typicalRows = rows.filter((r) => typicalScenarios.includes(r.scenario))

  const meanPayloadSavingsPercent =
    typicalRows.length > 0
      ? typicalRows.reduce((s, r) => s + r.payloadSavingsPercent, 0) / typicalRows.length
      : 0

  const meanUpdateSpeedupRatio =
    typicalRows.length > 0
      ? typicalRows.reduce((s, r) => s + r.updateSpeedupRatio, 0) / typicalRows.length
      : 0

  return {
    byScenario,
    generatedAt: new Date().toISOString(),
    headlines: {
      typicalEdits: {
        description:
          'Averages across sampled collections, excluding the all_fields scenario (partial PATCH equals full payload).',
        meanPayloadSavingsPercent: Math.round(meanPayloadSavingsPercent * 100) / 100,
        meanUpdateSpeedupRatio: Math.round(meanUpdateSpeedupRatio * 1000) / 1000,
        scenariosIncluded: typicalScenarios,
      },
    },
    notes: [
      'Update time is in-process payload.update() (local integration DB), not browser HTTP round-trip.',
      'Payload bytes are UTF-8 length of JSON.stringify(data) passed to update — proxy for wire size.',
      'Speedup ratio is fullMsMean / partialMsMean per cell, then averaged; values > 1 mean partial update was faster in this harness.',
    ],
  }
}

// ---------------------------------------------------------------------------
// Types for JSON output
// ---------------------------------------------------------------------------

type ReducerRow = {
  collectionIndex: number
  fieldCount: number
  fullBytes: number
  fullMsMean: number
  partialBytes: number
  partialMsMean: number
  savingsPercent: number
  scenario: EditScenario
  slug: string
}

type UpdateRow = {
  collectionIndex: number
  fullMsMean: number
  fullMsP50: number
  fullMsP95: number
  fullPayloadBytesMean: number
  iterations: number
  partialMsMean: number
  partialMsP50: number
  partialMsP95: number
  partialPayloadBytesMean: number
  payloadSavingsPercent: number
  scenario: EditScenario
  slug: string
  updateSpeedupRatio: number
}

type SaveMetricsFile = {
  byScenario: Record<
    EditScenario,
    {
      collectionsSampled: number
      meanFullMs: number
      meanFullPayloadBytes: number
      meanPartialMs: number
      meanPartialPayloadBytes: number
      meanPayloadSavingsPercent: number
      meanUpdateSpeedupRatio: number
      updateIterationsPerCell: number
    }
  >
  generatedAt: string
  headlines: {
    typicalEdits: {
      description: string
      meanPayloadSavingsPercent: number
      meanUpdateSpeedupRatio: number
      scenariosIncluded: EditScenario[]
    }
  }
  notes: string[]
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

vitestDescribe.skipIf(!RUN)('patch partial-save mega benchmark', () => {
  let payload: Payload
  let tagIds: (number | string)[] = []
  const shapes = generateAllShapes(COLLECTION_COUNT)
  const createdDocIds: Map<string, number | string> = new Map()

  beforeAll(async () => {
    process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')
    const res = await initPayloadInt(dirname)
    payload = res.payload

    const tags = await payload.find({ collection: TAGS_SLUG, limit: 50 })
    tagIds = tags.docs.map((d) => d.id)
  }, 120_000)

  afterAll(async () => {
    for (const [slug, id] of createdDocIds) {
      try {
        await payload.delete({ id, collection: slug })
      } catch {
        /* already cleaned */
      }
    }
    await payload?.destroy()
  }, 30_000)

  // -----------------------------------------------------------------------
  // 1. Reducer benchmarks: 100 shapes × 6 scenarios
  // -----------------------------------------------------------------------
  vitestIt(
    'reducer benchmarks across all collection shapes and scenarios',
    async () => {
      const rows: ReducerRow[] = []

      for (const shape of shapes) {
        for (const scenario of ALL_SCENARIOS) {
          const formState = buildFormStateForShape(shape, scenario)
          const fieldCount = Object.keys(formState).length

          const full = reduceFieldsToValues(formState, true)
          const partial = reduceModifiedFieldsToValues(formState, true)

          const fullBytes = utf8Bytes(full)
          const partialBytes = utf8Bytes(partial)

          let fullTotal = 0
          let partialTotal = 0

          for (let k = 0; k < REDUCER_ITERATIONS; k++) {
            const t0 = performance.now()
            reduceFieldsToValues(formState, true)
            fullTotal += performance.now() - t0

            const t1 = performance.now()
            reduceModifiedFieldsToValues(formState, true)
            partialTotal += performance.now() - t1
          }

          const savingsPercent =
            fullBytes > 0 ? Math.round(((fullBytes - partialBytes) / fullBytes) * 10000) / 100 : 0

          rows.push({
            slug: shape.slug,
            collectionIndex: shape.index,
            fieldCount,
            fullBytes,
            fullMsMean: fullTotal / REDUCER_ITERATIONS,
            partialBytes,
            partialMsMean: partialTotal / REDUCER_ITERATIONS,
            savingsPercent,
            scenario,
          })
        }
      }

      expect(rows.length).toBe(COLLECTION_COUNT * ALL_SCENARIOS.length)

      fs.mkdirSync(resultsDir, { recursive: true })
      fs.writeFileSync(
        path.join(resultsDir, 'reducer.json'),
        `${JSON.stringify({ count: COLLECTION_COUNT, generatedAt: new Date().toISOString(), iterationsPerCell: REDUCER_ITERATIONS, rows }, null, 2)}\n`,
      )
    },
    300_000,
  )

  // -----------------------------------------------------------------------
  // 2. payload.update() benchmarks: N collections × 100 requests × scenarios
  // -----------------------------------------------------------------------
  vitestIt(
    'update API benchmarks across collections and scenarios',
    async () => {
      const updateShapes = shapes.slice(0, UPDATE_COLLECTIONS)
      const updateRows: UpdateRow[] = []

      for (const shape of updateShapes) {
        const seedData = buildSeedData(shape, tagIds)
        const doc = await payload.create({ collection: shape.slug, data: seedData })
        createdDocIds.set(shape.slug, doc.id)

        for (const scenario of ALL_SCENARIOS) {
          const fullMs: number[] = []
          const partialMs: number[] = []
          const fullPayloadBytes: number[] = []
          const partialPayloadBytes: number[] = []
          const fullData = { ...buildSeedData(shape, tagIds) }

          // warmup
          for (let w = 0; w < 2; w++) {
            await payload.update({
              id: doc.id,
              collection: shape.slug,
              data: { ...fullData, title: `warm-full-${w}` },
            })
            const partialData = buildPartialUpdate(shape, scenario, 9000 + w, tagIds)
            await payload.update({
              id: doc.id,
              collection: shape.slug,
              data: partialData,
            })
          }

          for (let i = 0; i < UPDATE_ITERATIONS; i++) {
            const fullPayload = { ...fullData, title: `full-${scenario}-${i}` }
            const partialPayload = buildPartialUpdate(shape, scenario, i, tagIds)

            fullPayloadBytes.push(utf8Bytes(fullPayload))
            partialPayloadBytes.push(utf8Bytes(partialPayload))

            const t0 = performance.now()
            await payload.update({
              id: doc.id,
              collection: shape.slug,
              data: fullPayload,
            })
            fullMs.push(performance.now() - t0)

            const t1 = performance.now()
            await payload.update({
              id: doc.id,
              collection: shape.slug,
              data: partialPayload,
            })
            partialMs.push(performance.now() - t1)
          }

          const fullPayloadBytesMean = mean(fullPayloadBytes)
          const partialPayloadBytesMean = mean(partialPayloadBytes)
          const fullMsMean = mean(fullMs)
          const partialMsMean = mean(partialMs)

          const payloadSavingsPercent =
            fullPayloadBytesMean > 0
              ? Math.round(
                  ((fullPayloadBytesMean - partialPayloadBytesMean) / fullPayloadBytesMean) * 10000,
                ) / 100
              : 0

          const updateSpeedupRatio =
            partialMsMean > 0 ? Math.round((fullMsMean / partialMsMean) * 1000) / 1000 : 1

          updateRows.push({
            slug: shape.slug,
            collectionIndex: shape.index,
            fullMsMean,
            fullMsP50: p50(fullMs),
            fullMsP95: p95(fullMs),
            fullPayloadBytesMean,
            iterations: UPDATE_ITERATIONS,
            partialMsMean,
            partialMsP50: p50(partialMs),
            partialMsP95: p95(partialMs),
            partialPayloadBytesMean,
            payloadSavingsPercent,
            scenario,
            updateSpeedupRatio,
          })
        }
      }

      expect(updateRows.length).toBe(UPDATE_COLLECTIONS * ALL_SCENARIOS.length)

      fs.mkdirSync(resultsDir, { recursive: true })
      fs.writeFileSync(
        path.join(resultsDir, 'update.json'),
        `${JSON.stringify({ collectionsUsed: UPDATE_COLLECTIONS, generatedAt: new Date().toISOString(), iterationsPerCell: UPDATE_ITERATIONS, rows: updateRows }, null, 2)}\n`,
      )

      const saveMetrics = buildSaveMetrics(updateRows, UPDATE_ITERATIONS)
      fs.writeFileSync(
        path.join(resultsDir, 'save_metrics.json'),
        `${JSON.stringify(saveMetrics, null, 2)}\n`,
      )

      const headline = saveMetrics.headlines.typicalEdits
      // eslint-disable-next-line no-console
      console.log(
        `[patch-perf] Save metrics (typical edits, excl. all_fields): ~${headline.meanPayloadSavingsPercent}% less JSON in update body; mean full/partial update() time ratio ${headline.meanUpdateSpeedupRatio} (full ÷ partial). See results/save_metrics.json`,
      )
    },
    600_000,
  )
})
