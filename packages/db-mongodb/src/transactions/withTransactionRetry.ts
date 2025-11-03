import { isTransientTransactionError } from '../utilities/isTransientTransactionError.js'

/**
 * Configuration options for transaction retry behavior
 */
export interface TransactionRetryOptions {
  /**
   * Backoff multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number

  /**
   * Initial backoff delay in milliseconds
   * @default 100
   */
  initialBackoffMs?: number

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Optional logger function for retry attempts
   */
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wraps an async operation with retry logic for MongoDB TransientTransactionError
 *
 * MongoDB transactions can fail with TransientTransactionError due to transient conditions
 * like write conflicts during concurrent operations. MongoDB recommends retrying the entire
 * transaction when this error occurs.
 *
 * This function implements exponential backoff retry logic following MongoDB best practices.
 *
 * @param operation - The async operation to execute (typically a transaction block)
 * @param options - Configuration options for retry behavior
 * @returns The result of the operation
 * @throws The original error if it's not transient or max retries exceeded
 *
 * @example
 * ```typescript
 * await withTransactionRetry(async () => {
 *   const session = await client.startSession()
 *   try {
 *     await session.withTransaction(async () => {
 *       // Transaction operations here
 *     })
 *   } finally {
 *     await session.endSession()
 *   }
 * })
 * ```
 *
 * @see https://www.mongodb.com/docs/manual/core/transactions/#retry-transaction
 */
export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  options: TransactionRetryOptions = {},
): Promise<T> {
  const { backoffMultiplier = 2, initialBackoffMs = 100, maxRetries = 3, onRetry } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Check if this is a transient error that can be retried
      const isTransient = isTransientTransactionError(error)
      const canRetry = isTransient && attempt < maxRetries

      if (!canRetry) {
        // Either not transient, or we've exhausted retries
        throw error
      }

      // Calculate delay with exponential backoff
      const delayMs = initialBackoffMs * Math.pow(backoffMultiplier, attempt)

      // Call optional retry callback
      if (onRetry) {
        onRetry(attempt + 1, error, delayMs)
      }

      // Wait before retrying
      await sleep(delayMs)
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError
}
