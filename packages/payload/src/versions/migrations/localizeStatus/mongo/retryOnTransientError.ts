// MongoDB raises transient, retryable errors when a write races with a catalog
// change on the same collection (e.g. the collection or its indexes are still
// being created from a preceding insert). These errors are safe to retry.
const transientErrorLabels = ['TransientTransactionError', 'RetryableWriteError']

const transientErrorCodeNames = [
  'WriteConflict',
  'SnapshotUnavailable',
  'LockTimeout',
  'NoSuchTransaction',
]

const isTransientError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const err = error as {
    code?: number
    codeName?: string
    errorLabels?: string[]
    message?: string
  }

  if (err.errorLabels?.some((label) => transientErrorLabels.includes(label))) {
    return true
  }

  if (err.codeName && transientErrorCodeNames.includes(err.codeName)) {
    return true
  }

  // Catalog changes during writes surface as a generic message asking to retry.
  return typeof err.message === 'string' && err.message.includes('please retry')
}

/**
 * Runs a MongoDB write operation, retrying when MongoDB reports a transient,
 * retryable error such as a write conflict or a catalog change mid-write.
 */
export async function retryOnTransientError<T>(
  operation: () => Promise<T>,
  { delayMs = 100, maxAttempts = 5 }: { delayMs?: number; maxAttempts?: number } = {},
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!isTransientError(error) || attempt === maxAttempts) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw lastError
}
