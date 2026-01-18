import type { ErrorResult } from '@ruya.sa/payload'

/**
 * Error class for SDK API errors.
 * Contains the HTTP status code and error details from the API response.
 */
export class PayloadSDKError extends Error {
  /**
   * The error data from the API response.
   * For ValidationError, this contains `collection`, `global`, and `errors` array.
   */
  errors: ErrorResult['errors']

  /** The response object */
  response: Response

  /** HTTP status code */
  status: number

  constructor({
    errors,
    message,
    response,
    status,
  }: {
    errors: ErrorResult['errors']
    message: string
    response: Response
    status: number
  }) {
    super(message)
    this.name = 'PayloadSDKError'
    this.status = status
    this.errors = errors
    this.response = response
  }
}
