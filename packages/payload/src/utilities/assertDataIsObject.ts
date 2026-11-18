import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/APIError.js'

/**
 * Rejects create/update `data` that is not a plain JSON object (null, array, primitive, or
 * undefined from a missing or unsupported Content-Type). Runs after access control so
 * unauthorized users still get 403. A file-only upload on an upload collection legitimately has no
 * `data`.
 */
export const assertDataIsObject = (
  data: unknown,
  req: Pick<PayloadRequest, 'file'>,
  isUploadCollection = false,
): void => {
  if (data === undefined && isUploadCollection && req.file) {
    return
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new APIError('Request data must be a JSON object.', 400)
  }
}
