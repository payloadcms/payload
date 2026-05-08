/**
 * Export-specific batch processor for processing documents in batches during export.
 * Uses the generic batch processing utilities from useBatchProcessor.
 */
import type { PayloadRequest, SelectType, Sort, TypedUser, Where } from 'payload'

import type { ExportAfterHook, ExportBeforeHook } from '../types.js'

import { type BatchProcessorOptions } from '../utilities/useBatchProcessor.js'

/**
 * Export-specific batch processor options
 */
export interface ExportBatchProcessorOptions extends BatchProcessorOptions {
  debug?: boolean
}

/**
 * Find arguments for querying documents during export
 */
export interface ExportFindArgs {
  collection: string
  depth: number
  draft: boolean
  limit: number
  locale?: string
  overrideAccess: boolean
  page?: number
  select?: SelectType
  sort?: Sort
  user?: TypedUser
  where?: Where
}

/**
 * Options for processing an export operation
 */
export interface ExportProcessOptions<TDoc = unknown> {
  /**
   * The slug of the collection to export
   */
  collectionSlug: string
  /**
   * Arguments to pass to payload.find()
   */
  findArgs: ExportFindArgs
  /**
   * The export format - affects column tracking for CSV
   */
  format: 'csv' | 'json'
  /** Lifecycle hooks for this export operation */
  hooks?: {
    after?: ExportAfterHook
    before?: ExportBeforeHook
  }
  /**
   * Maximum number of documents to export
   */
  maxDocs: number
  /**
   * The Payload request object
   */
  req: PayloadRequest
  /**
   * Starting page for pagination (default: 1)
   */
  startPage?: number
  /** Total number of docs available (used to compute totalBatches for hooks) */
  totalDocs?: number
  /**
   * Transform function to apply to each document
   */
  transformDoc: (doc: TDoc) => Record<string, unknown>
}

/**
 * Result from processing an export operation
 */
export interface ExportResult {
  /**
   * Discovered column names (for CSV exports)
   */
  columns: string[]
  /**
   * Transformed documents ready for output
   */
  docs: Record<string, unknown>[]
  /**
   * Total number of documents fetched
   */
  fetchedCount: number
}

/**
 * Creates an export batch processor with the specified options.
 *
 * @param options - Configuration options for the batch processor
 * @returns An object containing the processExport method
 *
 * @example
 * ```ts
 * const processor = createExportBatchProcessor({ batchSize: 100, debug: true })
 *
 * const result = await processor.processExport({
 *   collectionSlug: 'posts',
 *   findArgs: { collection: 'posts', depth: 1, draft: false, limit: 100, overrideAccess: false },
 *   format: 'csv',
 *   maxDocs: 1000,
 *   req,
 *   transformDoc: (doc) => flattenObject({ data: doc }),
 * })
 * ```
 */
export function createExportBatchProcessor(options: ExportBatchProcessorOptions = {}) {
  const batchSize = options.batchSize ?? 100
  const debug = options.debug ?? false

  const computeTotalBatches = (totalDocs: number | undefined, maxDocs: number): number => {
    const effectiveDocs =
      totalDocs !== undefined
        ? Math.min(totalDocs, maxDocs === Number.POSITIVE_INFINITY ? totalDocs : maxDocs)
        : 0
    return effectiveDocs > 0 ? Math.ceil(effectiveDocs / batchSize) : 1
  }

  /**
   * Process an export operation by fetching and transforming documents in batches.
   *
   * @param processOptions - Options for the export operation
   * @returns The export result containing transformed documents and column info
   */
  const processExport = async <TDoc>(
    processOptions: ExportProcessOptions<TDoc>,
  ): Promise<ExportResult> => {
    const {
      findArgs,
      format,
      hooks,
      maxDocs,
      req,
      startPage = 1,
      totalDocs,
      transformDoc,
    } = processOptions

    const totalBatches = computeTotalBatches(totalDocs, maxDocs)

    const docs: Record<string, unknown>[] = []
    const columnsSet = new Set<string>()
    const columns: string[] = []

    let currentPage = startPage
    let fetched = 0
    let hasNextPage = true

    while (hasNextPage) {
      const remaining = Math.max(0, maxDocs - fetched)

      if (remaining === 0) {
        break
      }

      const result = await req.payload.find({
        ...findArgs,
        limit: Math.min(batchSize, remaining),
        page: currentPage,
      })

      if (debug) {
        req.payload.logger.debug(
          `Processing export batch ${currentPage} with ${result.docs.length} documents`,
        )
      }

      const batchNumber = currentPage - startPage + 1
      const originalDocs = result.docs as Record<string, unknown>[]
      const batchData = result.docs.map((doc) => transformDoc(doc as TDoc))

      const dataToWrite =
        hooks?.before && batchData.length > 0
          ? await hooks.before({
              batchNumber,
              data: batchData,
              format,
              originalData: originalDocs,
              req,
              totalBatches,
            })
          : batchData

      for (const row of dataToWrite) {
        docs.push(row)

        if (format === 'csv') {
          for (const key of Object.keys(row)) {
            if (!columnsSet.has(key)) {
              columnsSet.add(key)
              columns.push(key)
            }
          }
        }
      }

      if (hooks?.after && dataToWrite.length > 0) {
        await hooks.after({
          batchNumber,
          data: dataToWrite,
          format,
          originalData: originalDocs,
          req,
          totalBatches,
        })
      }

      fetched += result.docs.length
      hasNextPage = result.hasNextPage && fetched < maxDocs
      currentPage++
    }

    return { columns, docs, fetchedCount: fetched }
  }

  /**
   * Async generator for streaming export - yields batches instead of collecting all.
   * Useful for streaming exports where you want to process batches as they're fetched.
   *
   * @param processOptions - Options for the export operation
   * @yields Batch results containing transformed documents and discovered columns
   *
   * @example
   * ```ts
   * const processor = createExportBatchProcessor({ batchSize: 100 })
   *
   * for await (const batch of processor.streamExport({ ... })) {
   *   // Process each batch as it's yielded
   *   console.log(`Got ${batch.docs.length} documents`)
   * }
   * ```
   */
  async function* streamExport<TDoc>(
    processOptions: ExportProcessOptions<TDoc>,
  ): AsyncGenerator<{ columns: string[]; docs: Record<string, unknown>[] }> {
    const {
      findArgs,
      format,
      hooks,
      maxDocs,
      req,
      startPage = 1,
      totalDocs,
      transformDoc,
    } = processOptions

    const totalBatches = computeTotalBatches(totalDocs, maxDocs)

    const columnsSet = new Set<string>()
    const columns: string[] = []

    let currentPage = startPage
    let fetched = 0
    let hasNextPage = true

    while (hasNextPage) {
      const remaining = Math.max(0, maxDocs - fetched)

      if (remaining === 0) {
        break
      }

      const result = await req.payload.find({
        ...findArgs,
        limit: Math.min(batchSize, remaining),
        page: currentPage,
      })

      if (debug) {
        req.payload.logger.debug(
          `Streaming export batch ${currentPage} with ${result.docs.length} documents`,
        )
      }

      const batchNumber = currentPage - startPage + 1
      const originalDocs = result.docs as Record<string, unknown>[]
      const batchData = result.docs.map((doc) => transformDoc(doc as TDoc))

      const dataToWrite =
        hooks?.before && batchData.length > 0
          ? await hooks.before({
              batchNumber,
              data: batchData,
              format,
              originalData: originalDocs,
              req,
              totalBatches,
            })
          : batchData

      for (const row of dataToWrite) {
        if (format === 'csv') {
          for (const key of Object.keys(row)) {
            if (!columnsSet.has(key)) {
              columnsSet.add(key)
              columns.push(key)
            }
          }
        }
      }

      yield { columns: [...columns], docs: dataToWrite }

      if (hooks?.after && dataToWrite.length > 0) {
        await hooks.after({
          batchNumber,
          data: dataToWrite,
          format,
          originalData: originalDocs,
          req,
          totalBatches,
        })
      }

      fetched += result.docs.length
      hasNextPage = result.hasNextPage && fetched < maxDocs
      currentPage++
    }
  }

  /**
   * Discover all columns from the dataset by scanning through all batches.
   * Useful for CSV exports where you need to know all columns before streaming.
   *
   * @param processOptions - Options for the export operation
   * @returns Array of discovered column names
   */
  const discoverColumns = async <TDoc>(
    processOptions: ExportProcessOptions<TDoc>,
  ): Promise<string[]> => {
    const { findArgs, maxDocs, req, startPage = 1, transformDoc } = processOptions

    const columnsSet = new Set<string>()
    const columns: string[] = []

    let currentPage = startPage
    let fetched = 0
    let hasNextPage = true

    while (hasNextPage) {
      const remaining = Math.max(0, maxDocs - fetched)

      if (remaining === 0) {
        break
      }

      const result = await req.payload.find({
        ...findArgs,
        limit: Math.min(batchSize, remaining),
        page: currentPage,
      })

      if (debug) {
        req.payload.logger.debug(
          `Scanning columns from batch ${currentPage} with ${result.docs.length} documents`,
        )
      }

      for (const doc of result.docs) {
        const transformedDoc = transformDoc(doc as TDoc)

        for (const key of Object.keys(transformedDoc)) {
          if (!columnsSet.has(key)) {
            columnsSet.add(key)
            columns.push(key)
          }
        }
      }

      fetched += result.docs.length
      hasNextPage = result.hasNextPage && fetched < maxDocs
      currentPage++
    }

    if (debug) {
      req.payload.logger.debug(`Discovered ${columns.length} columns`)
    }

    return columns
  }

  return {
    discoverColumns,
    processExport,
    streamExport,
  }
}
