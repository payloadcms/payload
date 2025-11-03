/**
 * Checks if an error is a MongoDB TransientTransactionError
 *
 * TransientTransactionError is a label MongoDB applies to errors that are safe to retry.
 * These errors typically occur due to transient conditions like write conflicts during
 * concurrent operations.
 *
 * @param error - The error to check
 * @returns true if the error has the TransientTransactionError label
 *
 * @see https://www.mongodb.com/docs/manual/core/transactions/#transienttransactionerror
 */
export function isTransientTransactionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  if (!('errorLabels' in error)) {
    return false
  }

  const { errorLabels } = error

  if (!Array.isArray(errorLabels)) {
    return false
  }

  return errorLabels.includes('TransientTransactionError')
}
