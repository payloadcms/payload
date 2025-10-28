import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class QueryError extends APIError<{ path: string }[]> {
  constructor(results: { path: string }[]) {
    const message = `The following path${results.length === 1 ? '' : 's'} cannot be queried:`

    super(
      `${message} ${results.map((err) => err.path).join(', ')}`,
      httpStatus.BAD_REQUEST,
      results,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'QueryError'
    Object.defineProperty(this.constructor, 'name', { value: 'QueryError' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, QueryError.prototype)
  }
}
