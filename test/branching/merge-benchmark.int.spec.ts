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
const progressPath = `${outputPath}.progress`

const adapterMethods = [
  'batchProcessing',
  'count',
  'create',
  'deleteMany',
  'deleteOne',
  'find',
  'findOne',
  'updateMany',
  'updateOne',
] as const

type AdapterMethod = (typeof adapterMethods)[number]

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
    const { branchID, changeIDs, documentIDs } = await seedBenchmarkRows({
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

    const callCounts = new Map<AdapterMethod, number>()
    const restoreAdapterMethods = recordAdapterMethodCalls({ callCounts, payload })
    const memory = startMemoryMeasurement()
    const startedAt = performance.now()
    const workloadPreparationStartedAt = performance.now()
    const attemptedChanges = documentIDs.map((documentID, index) => ({
      applicationOutcome: 'attempted',
      changeID: changeIDs[index],
      cleanupOutcome: 'pending',
      collectionSlug: postsSlug,
      docID: documentID,
      docTitle: `${titlePrefix}-${index}`,
      operation: 'create',
      recoveryOutcome: 'notNeeded',
      sourceID: documentID,
      targetID: documentID,
    }))
    const workloadPreparationDurationMs = performance.now() - workloadPreparationStartedAt

    writeJSON({
      path: progressPath,
      value: {
        elapsedMs: performance.now() - startedAt,
        memory: memory.current(),
        phase: 'workload-prepared',
        selectedDocuments: attemptedChanges.length,
      },
    })

    const executionStartedAt = performance.now()
    const startedAtDate = new Date().toISOString()
    const mergeEventDocument = await payload.create({
      collection: branchMergesSlug,
      data: {
        branch,
        changes: attemptedChanges,
        startedAt: startedAtDate,
        status: 'inProgress',
        targetBranch: 'main',
      },
      overrideAccess: true,
    })
    const promotionResults = await payload.db.batchProcessing({
      batchSize: 1_000,
      operations: documentIDs.map((documentID) => ({
        args: {
          id: documentID,
          branch: false,
          collection: postsSlug,
          data: { _branch: 'main' },
          returning: false,
        },
        operation: 'updateOne' as const,
      })),
    })
    const successfulPromotions = promotionResults.filter(({ status }) => status === 'succeeded')

    expect(successfulPromotions).toHaveLength(mergeDocumentCount)
    writeJSON({
      path: progressPath,
      value: {
        elapsedMs: performance.now() - startedAt,
        memory: memory.current(),
        phase: 'content-promoted',
        promotedDocuments: successfulPromotions.length,
      },
    })

    const cleanupResults = await payload.db.batchProcessing({
      batchSize: 1_000,
      operations: changeIDs.map((changeID) => ({
        args: {
          branch: false,
          collection: branchChangesSlug,
          returning: false,
          where: { id: { equals: changeID } },
        },
        operation: 'deleteOne' as const,
      })),
    })
    const successfulCleanups = cleanupResults.filter(({ status }) => status === 'succeeded')
    const completedAt = new Date().toISOString()

    expect(successfulCleanups).toHaveLength(mergeDocumentCount)
    await payload.update({
      id: mergeEventDocument.id,
      collection: branchMergesSlug,
      data: {
        changes: attemptedChanges.map((change) => ({
          ...change,
          applicationOutcome: 'committed',
          cleanupOutcome: 'completed',
        })),
        completedAt,
        mergedAt: completedAt,
        status: 'succeeded',
      },
      overrideAccess: true,
    })
    await payload.update({
      id: branchID,
      collection: branchesSlug,
      data: { mergedAt: completedAt, status: 'merged' },
      overrideAccess: true,
    })
    const executionDurationMs = performance.now() - executionStartedAt

    memory.stop()
    restoreAdapterMethods()
    const durationMs = performance.now() - startedAt
    const pendingAfterMerge = await payload.count({
      collection: branchChangesSlug,
      overrideAccess: true,
      where: { branch: { equals: branch } },
    })
    const promotedDocuments = await payload.count({
      branch: false,
      collection: postsSlug,
      overrideAccess: true,
      where: { title: { contains: titlePrefix } },
    })
    const firstHistoryPage = await payload.find({
      collection: branchMergesSlug,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      page: 1,
      sort: '-mergedAt',
      where: { branch: { equals: branch } },
    })
    const secondHistoryPage = await payload.find({
      collection: branchMergesSlug,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      page: 2,
      sort: '-mergedAt',
      where: { branch: { equals: branch } },
    })
    const storedMergeEvent = firstHistoryPage.docs[0]
    const sampleIndexes = [0, Math.floor(mergeDocumentCount / 2), mergeDocumentCount - 1]

    for (const index of sampleIndexes) {
      const document = await payload.findByID({
        id: documentIDs[index]!,
        branch: false,
        collection: postsSlug,
        overrideAccess: true,
      })

      expect(document.title).toBe(`${titlePrefix}-${index}`)
    }

    const adapterMethodCalls = Object.fromEntries(callCounts) as Partial<
      Record<AdapterMethod, number>
    >
    const databaseCallCount = Object.entries(adapterMethodCalls).reduce(
      (total, [method, count]) => total + (method === 'batchProcessing' ? 0 : (count ?? 0)),
      0,
    )

    return {
      adapter: payload.db.packageName,
      adapterMethodCalls,
      branch,
      correctness: {
        batchPromotions: successfulPromotions.length,
        historyEvents: firstHistoryPage.totalDocs,
        pendingChanges: pendingAfterMerge.totalDocs,
        promotedDocuments: promotedDocuments.totalDocs,
        registryCleanups: successfulCleanups.length,
        sampleDocumentsVerified: sampleIndexes.length,
        selectedDocuments: attemptedChanges.length,
      },
      databaseCallCount,
      durationMs,
      executionDurationMs,
      generatedAt: new Date().toISOString(),
      history: {
        firstPageDocuments: firstHistoryPage.docs.length,
        secondPageDocuments: secondHistoryPage.docs.length,
        totalPages: firstHistoryPage.totalPages,
      },
      logBytes: Buffer.byteLength(JSON.stringify(storedMergeEvent)),
      memory: memory.result(),
      mergeDocumentCount,
      node: process.version,
      notes: [
        'MongoDB only.',
        'Seed time is reported separately and excluded from merge duration.',
        'The script creates a known 10,000-change workload without running the full merge planner.',
        'It submits all promotions through the ordered adapter batch contract and persists the production merge-ledger shape.',
        'It intentionally does not run 10,000 Local API lifecycles; ordinary MongoDB integration tests cover planning, access, hooks, validation, versions, recovery, and cleanup.',
        'Bulk seed inserts bypass Payload lifecycle work.',
        'The workload uses unversioned branch-created documents to isolate adapter batching, ledger size, and memory growth.',
        'Adapter method counts exclude raw bulk seed inserts and post-merge verification.',
        'Timing is diagnostic output, not a test threshold.',
      ],
      seedDurationMs,
      totalContentRowCount,
      workloadPreparationDurationMs,
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
    current: () => {
      const current = process.memoryUsage()

      return { heapBytes: current.heapUsed, rssBytes: current.rss }
    },
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
    sample,
    stop: () => {
      clearInterval(interval)
      sample()
    },
  }
}

const recordAdapterMethodCalls = ({
  callCounts,
  payload,
}: {
  callCounts: Map<AdapterMethod, number>
  payload: Payload
}): (() => void) => {
  const adapter = payload.db as unknown as Record<string, (...args: unknown[]) => unknown>
  const originals = new Map<AdapterMethod, (...args: unknown[]) => unknown>()

  for (const method of adapterMethods) {
    const original = adapter[method]

    if (typeof original !== 'function') {
      continue
    }

    originals.set(method, original)
    adapter[method] = function (...args: unknown[]) {
      callCounts.set(method, (callCounts.get(method) ?? 0) + 1)

      return original.apply(this, args)
    }
  }

  return () => {
    for (const [method, original] of originals) {
      adapter[method] = original
    }
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
