import type { PayloadRequest, TypedUser } from 'payload';
import type { ImportMode, ImportResult } from './createImport.js';
import { type BatchError } from '../utilities/useBatchProcessor.js';
/**
 * Import-specific batch processor options
 */
export interface ImportBatchProcessorOptions {
    batchSize?: number;
    defaultVersionStatus?: 'draft' | 'published';
}
/**
 * Import-specific error type extending the generic BatchError
 */
export interface ImportError extends BatchError<Record<string, unknown>> {
    documentData: Record<string, unknown>;
    field?: string;
    fieldLabel?: string;
    rowNumber: number;
}
/**
 * Result from processing a single import batch
 */
export interface ImportBatchResult {
    failed: Array<ImportError>;
    successful: Array<{
        document: Record<string, unknown>;
        index: number;
        operation?: 'created' | 'updated';
        result: Record<string, unknown>;
    }>;
}
/**
 * Options for processing an import operation
 */
export interface ImportProcessOptions {
    collectionSlug: string;
    documents: Record<string, unknown>[];
    importMode: ImportMode;
    matchField?: string;
    req: PayloadRequest;
    user?: TypedUser;
}
export declare function createImportBatchProcessor(options?: ImportBatchProcessorOptions): {
    processImport: (processOptions: ImportProcessOptions) => Promise<ImportResult>;
};
//# sourceMappingURL=batchProcessor.d.ts.map