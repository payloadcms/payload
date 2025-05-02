// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

// This gets dynamically reassigned during compilation
export let APIErrorName = 'APIError'

class ExtendableError<TData extends object = { [key: string]: unknown }> extends Error {
  data: TData

  isOperational: boolean

  isPublic: boolean

  status: number

  constructor(message: string, status: number, data: TData, isPublic: boolean) {
    super(message, {
      // show data in cause
      cause: data,
    })
    APIErrorName = this.constructor.name
    this.name = this.constructor.name
    this.message = message
    this.status = status
    this.data = data
    this.isPublic = isPublic
    this.isOperational = true // This is required since bluebird 4 doesn't append it anymore.
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
export class APIError<
  TData extends null | object = { [key: string]: unknown } | null,
> extends ExtendableError<TData> {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {object} data - response data to be returned.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor(
    message: string,
    status: number = httpStatus.INTERNAL_SERVER_ERROR,
    data: TData = null,
    isPublic = false,
  ) {
    super(message, status, data, isPublic)
  }
}
