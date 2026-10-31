import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import { Types } from 'mongoose'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchChangesSlug, branchesSlug, branchMergesSlug, postsSlug } from './shared.js'

const isBenchmarkEnabled = process.env.BRANCHING_MERGE_BENCHMARK === 'true'
const totalContentRowCount = Number(process.env.BRANCHING_MERGE_BENCHMARK_ROWS ?? 50_000)
const mergeDocumentCount = Number(process.env.BRANCHING_MERGE_BENCHMARK_MERGE_COUNT ?? 10_000)
const seedBatchSize = Number(process.env.BRANCHING_MERGE_BENCHMARK_SEED_BATCH_SIZE ?? 5_000)
const timeoutMs = Number(process.env.BRANCHING_MERGE_BENCHMARK_TIMEOUT_MS ?? 300_000)
const outputPath =
  process.env.BRANCHING_MERGE_BENCHMARK_OUTPUT ?? '/tmp/content-branching-merge-benchmark.json'

type BenchmarkMemory = {
  baselineHeapBytes: number
  baselineRSSBytes: number
  peakHeapBytes: number
  peakHeapIncreaseBytes: number
  peakRSSBytes: number
  peakRSSIncreaseBytes: number
}

test.suite(
  'Content branching merge benchmark',
  { config: './config.ts', db: 'mongo', resetBetweenTests: false },
  () => {
    test.skipIf(!isBenchmarkEnabled)(
      'should stress 10,000 document promotions among 50,000 or more content rows',
      async ({ payload }) => {
        validateBenchmarkOptions()

        const report = await runBenchmark({ payload })

        writeJSON({ path: outputPath, value: report })
        expect(report.correctness).toEqual({
          batchPromotions: mergeDocumentCount,
          historyEvents: 1,
          pendingChanges: 0,
          promotedDocuments: mergeDocumentCount,
          registryCleanups: mergeDocumentCount,
          sampleDocumentsVerified: 3,
          selectedDocuments: mergeDocumentCount,
        })
      },
      timeoutMs,
    )
  },
)

const runBenchmark = async ({ payload }: { payload: Payload }) => {
  const branch = 'merge-benchmark'
  const titlePrefix = 'merge-benchmark-document'
  const originalLoggerLevel = payload.logger.level

  payload.logger.level = 'silent'

  try {
    const seedStartedAt = performance.now()
    const { documentIDs } = await seedBenchmarkRows({
      branch,
      payload,
      titlePrefix,
    })
    const seedDurationMs = performance.now() - seedStartedAt
    const pendingBeforeMerge = await payload.count({
      collection: branchChangesSlug,
      overrideAccess: true,
      where: { branch: { equals: branch } },
    })

    expect(pendingBeforeMerge.totalDocs).toBe(mergeDocumentCount)

    const memory = startMemoryMeasurement()
    const startedAt = performance.now()
    const executionStartedAt = performance.now()
    const mergeResult = await payload.branches.merge({ branch, overrideAccess: true })
    const executionDurationMs = performance.now() - executionStartedAt

    expect(mergeResult.blocked).toEqual([])
    expect(mergeResult.validationErrors).toEqual([])
    expect(mergeResult.merged).toHaveLength(mergeDocumentCount)

    memory.stop()
    const durationMs = performance.now() - startedAt
    const pendingAfterMerge = await payload.count({
      collection: branchChangesSlug,
      overrideAccess: true,
      where: { branch: { equals: branch } },
    })
    const promotedDocuments = await payload.count({
      branch: 'main',
      collection: postsSlug,
      overrideAccess: true,
      where: { title: { contains: titlePrefix } },
    })
    const historyEvents = await payload.count({
      collection: branchMergesSlug,
      overrideAccess: true,
      where: { branch: { equals: branch } },
    })
    const sampleIndexes = [0, Math.floor(mergeDocumentCount / 2), mergeDocumentCount - 1]

    for (const index of sampleIndexes) {
      const document = await payload.findByID({
        id: documentIDs[index]!,
        branch: 'main',
        collection: postsSlug,
        overrideAccess: true,
      })

      expect(document.title).toBe(`${titlePrefix}-${index}`)
    }

    return {
      adapter: payload.db.packageName,
      branch,
      correctness: {
        batchPromotions: mergeResult.merged.length,
        historyEvents: historyEvents.totalDocs,
        pendingChanges: pendingAfterMerge.totalDocs,
        promotedDocuments: promotedDocuments.totalDocs,
        registryCleanups: pendingBeforeMerge.totalDocs - pendingAfterMerge.totalDocs,
        sampleDocumentsVerified: sampleIndexes.length,
        selectedDocuments: documentIDs.length,
      },
      durationMs,
      executionDurationMs,
      generatedAt: new Date().toISOString(),
      memory: memory.result(),
      mergeDocumentCount,
      node: process.version,
      seedDurationMs,
      totalContentRowCount,
    }
  } finally {
    payload.logger.level = originalLoggerLevel
  }
}

const seedBenchmarkRows = async ({
  branch,
  payload,
  titlePrefix,
}: {
  branch: string
  payload: Payload
  titlePrefix: string
}): Promise<{ branchID: number | string; changeIDs: string[]; documentIDs: string[] }> => {
  const branchDocument = await payload.create({
    collection: branchesSlug,
    data: { name: 'Merge benchmark', slug: branch },
    overrideAccess: true,
  })

  const adapter = payload.db as MongooseAdapter
  const postsCollection = adapter.collections[postsSlug].collection
  const changesCollection = adapter.collections[branchChangesSlug].collection
  const backgroundRowCount = totalContentRowCount - mergeDocumentCount
  const timestamp = new Date()

  for (let batchStart = 0; batchStart < backgroundRowCount; batchStart += seedBatchSize) {
    const batchEnd = Math.min(batchStart + seedBatchSize, backgroundRowCount)
    const documents = Array.from({ length: batchEnd - batchStart }, (_, offset) => {
      const index = batchStart + offset

      return {
        _id: new Types.ObjectId(),
        _branch: 'main',
        createdAt: timestamp,
        order: index,
        title: `background-document-${index}`,
        updatedAt: timestamp,
      }
    })

    await postsCollection.insertMany(documents, { ordered: true })
  }

  const changeIDs: string[] = []
  const documentIDs: string[] = []

  for (let batchStart = 0; batchStart < mergeDocumentCount; batchStart += seedBatchSize) {
    const batchEnd = Math.min(batchStart + seedBatchSize, mergeDocumentCount)
    const documents: Record<string, unknown>[] = []
    const changes: Record<string, unknown>[] = []

    for (let index = batchStart; index < batchEnd; index += 1) {
      const id = new Types.ObjectId()
      const changeID = new Types.ObjectId()

      changeIDs.push(String(changeID))
      documentIDs.push(String(id))
      documents.push({
        _id: id,
        _branch: branch,
        createdAt: timestamp,
        order: backgroundRowCount + index,
        title: `${titlePrefix}-${index}`,
        updatedAt: timestamp,
      })
      changes.push({
        _id: changeID,
        branch,
        collectionSlug: postsSlug,
        createdAt: timestamp,
        doc: { relationTo: postsSlug, value: id },
        documentID: String(id),
        entityType: 'collection',
        operation: 'create',
        updatedAt: timestamp,
      })
    }

    await postsCollection.insertMany(documents, { ordered: true })
    await changesCollection.insertMany(changes, { ordered: true })
  }

  return { branchID: branchDocument.id, changeIDs, documentIDs }
}

const startMemoryMeasurement = () => {
  const baseline = process.memoryUsage()
  let peakHeapBytes = baseline.heapUsed
  let peakRSSBytes = baseline.rss
  const sample = () => {
    const current = process.memoryUsage()

    peakHeapBytes = Math.max(peakHeapBytes, current.heapUsed)
    peakRSSBytes = Math.max(peakRSSBytes, current.rss)
  }
  const interval = setInterval(sample, 100)

  interval.unref()

  return {
    result: (): BenchmarkMemory => {
      sample()

      return {
        baselineHeapBytes: baseline.heapUsed,
        baselineRSSBytes: baseline.rss,
        peakHeapBytes,
        peakHeapIncreaseBytes: Math.max(0, peakHeapBytes - baseline.heapUsed),
        peakRSSBytes,
        peakRSSIncreaseBytes: Math.max(0, peakRSSBytes - baseline.rss),
      }
    },
    stop: () => {
      clearInterval(interval)
      sample()
    },
  }
}

const validateBenchmarkOptions = (): void => {
  for (const [name, value] of [
    ['BRANCHING_MERGE_BENCHMARK_ROWS', totalContentRowCount],
    ['BRANCHING_MERGE_BENCHMARK_MERGE_COUNT', mergeDocumentCount],
    ['BRANCHING_MERGE_BENCHMARK_SEED_BATCH_SIZE', seedBatchSize],
    ['BRANCHING_MERGE_BENCHMARK_TIMEOUT_MS', timeoutMs],
  ] as const) {
    if (!Number.isInteger(value) || value < 1) {
      throw new TypeError(`${name} must be a positive integer.`)
    }
  }

  if (totalContentRowCount < mergeDocumentCount) {
    throw new TypeError(
      'BRANCHING_MERGE_BENCHMARK_ROWS must be greater than or equal to BRANCHING_MERGE_BENCHMARK_MERGE_COUNT.',
    )
  }
}

const writeJSON = ({ path: filePath, value }: { path: string; value: unknown }): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}
