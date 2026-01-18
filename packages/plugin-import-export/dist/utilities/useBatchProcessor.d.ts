/**
 * Generic batch processing utilities for import/export operations.
 * This module provides reusable types and helper functions for processing
 * items in batches with error handling and result aggregation.
 */
/**
 * Core batch processing options
 */
export interface BatchProcessorOptions {
    batchSize?: number;
}
/**
 * Generic error type for batch operations
 */
export interface BatchError<TItem = unknown> {
    error: string;
    item: TItem;
    itemIndex: number;
    type: 'custom' | 'database' | 'duplicate' | 'notFound' | 'unknown' | 'validation';
}
/**
 * Generic success result for a single item
 */
export interface BatchItemResult<TItem = unknown, TResult = unknown> {
    index: number;
    item: TItem;
    operation?: string;
    result: TResult;
}
/**
 * Result from processing a single batch
 */
export interface BatchResult<TItem = unknown, TResult = unknown> {
    failed: Array<BatchError<TItem>>;
    successful: Array<BatchItemResult<TItem, TResult>>;
}
/**
 * Final aggregated result from processing all batches
 */
export interface ProcessResult<TItem = unknown> {
    errors: Array<{
        error: string;
        index: number;
        item: TItem;
    }>;
    processedCount: number;
    total: number;
}
/**
 * Split an array of items into batches of a specified size.
 *
 * @param items - The array of items to split into batches
 * @param batchSize - The maximum number of items per batch
 * @returns An array of batches, where each batch is an array of items
 *
 * @example
 * ```ts
 * const items = [1, 2, 3, 4, 5];
 * const batches = createBatches(items, 2);
 * // Result: [[1, 2], [3, 4], [5]]
 * ```
 */
export declare function createBatches<T>(items: T[], batchSize: number): T[][];
/**
 * Extract a human-readable error message from an unknown error value.
 *
 * @param error - The error value to extract a message from
 * @returns A string representation of the error message
 *
 * @example
 * ```ts
 * extractErrorMessage(new Error('Something went wrong'));
 * // Result: 'Something went wrong'
 *
 * extractErrorMessage({ message: 'Custom error' });
 * // Result: 'Custom error'
 *
 * extractErrorMessage('String error');
 * // Result: 'String error'
 * ```
 */
export declare function extractErrorMessage(error: unknown): string;
/**
 * Categorize an error based on its message content.
 * This helps provide more specific error types for better error handling.
 *
 * @param error - The error to categorize
 * @returns The categorized error type
 *
 * @example
 * ```ts
 * categorizeError(new Error('Validation failed'));
 * // Result: 'validation'
 *
 * categorizeError(new Error('Document not found'));
 * // Result: 'notFound'
 *
 * categorizeError(new Error('Duplicate key error'));
 * // Result: 'duplicate'
 * ```
 */
export declare function categorizeError(error: unknown): BatchError['type'];
//# sourceMappingURL=useBatchProcessor.d.ts.map