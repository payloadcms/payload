import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'

/**
 * Prevents guarded document, global, upload, and version mutation entry points from writing
 * through an active validation request. Reads and writes made with a separate request are
 * intentionally unaffected.
 */
export function assertNoValidationWrite(req?: Partial<PayloadRequest>): void {
  if (req?.operation === 'validate') {
    throw new APIError('Payload writes are not allowed during validation.')
  }
}
