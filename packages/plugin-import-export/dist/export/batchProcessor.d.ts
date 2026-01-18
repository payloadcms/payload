/**
 * Export-specific batch processor for processing documents in batches during export.
 * Uses the generic batch processing utilities from useBatchProcessor.
 */
import type { PayloadRequest, SelectType, Sort, TypedUser, Where } from 'payload';
import { type BatchProcessorOptions } from '../utilities/useBatchProcessor.js';
/**
 * Export-specific batch processor options
 */
export interface ExportBatchProcessorOptions extends BatchProcessorOptions {
    debug?: boolean;
}
/**
 * Find arguments for querying documents during export
 */
export interface ExportFindArgs {
    collection: string;
    depth: number;
    draft: boolean;
    limit: number;
    locale?: string;
    overrideAccess: boolean;
    page?: number;
    select?: SelectType;
    sort?: Sort;
    user?: TypedUser;
    where?: Where;
}
/**
 * Options for processing an export operation
 */
export interface ExportProcessOptions<TDoc = unknown> {
    /**
     * The slug of the collection to export
     */
    collectionSlug: string;
    /**
     * Arguments to pass to payload.find()
     */
    findArgs: ExportFindArgs;
    /**
     * The export format - affects column tracking for CSV
     */
    format: 'csv' | 'json';
    /**
     * Maximum number of documents to export
     */
    maxDocs: number;
    /**
     * The Payload request object
     */
    req: PayloadRequest;
    /**
     * Starting page for pagination (default: 1)
     */
    startPage?: number;
    /**
     * Transform function to apply to each document
     */
    transformDoc: (doc: TDoc) => Record<string, unknown>;
}
/**
 * Result from processing an export operation
 */
export interface ExportResult {
    /**
     * Discovered column names (for CSV exports)
     */
    columns: string[];
    /**
     * Transformed documents ready for output
     */
    docs: Record<string, unknown>[];
    /**
     * Total number of documents fetched
     */
    fetchedCount: number;
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
 *   transformDoc: (doc) => flattenObject({ doc }),
 * })
 * ```
 */
export declare function createExportBatchProcessor(options?: ExportBatchProcessorOptions): {
    discoverColumns: <TDoc>(processOptions: ExportProcessOptions<TDoc>) => Promise<string[]>;
    processExport: <TDoc>(processOptions: ExportProcessOptions<TDoc>) => Promise<ExportResult>;
    streamExport: <TDoc>(processOptions: ExportProcessOptions<TDoc>) => AsyncGenerator<{
        columns: string[];
        docs: Record<string, unknown>[];
    }>;
};
//# sourceMappingURL=batchProcessor.d.ts.map