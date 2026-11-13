import type { PayloadRequest } from '../../../types/index.js'

import { FileUploadError, ValidationError } from '../../../errors/index.js'
import { TransformerContractError } from '../../../errors/TransformerContractError.js'

/**
 * Maps an error from transformer planning or the pipeline. A validation error and a broken
 * transformer contract keep their own message; anything else is logged and becomes a
 * `FileUploadError`.
 */
export function toFileUploadError({ err, req }: { err: unknown; req: PayloadRequest }): Error {
  if (err instanceof ValidationError) {
    return err
  }

  req.payload.logger.error(err)

  return err instanceof TransformerContractError ? err : new FileUploadError(req.t)
}
