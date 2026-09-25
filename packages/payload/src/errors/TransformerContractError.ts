import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

/**
 * Thrown when a file transformer violates the `handleRequest`/`getSourceFile`
 * contract — e.g. calling `getSourceFile` more than once, or consuming it and
 * returning `continue` without a replacement response. Payload logs the cause
 * and returns `500`, the same as any other uncaught transformer error.
 */
export class TransformerContractError extends APIError {
  constructor(message: string) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR)
  }
}
