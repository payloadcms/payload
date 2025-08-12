import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class InvalidConfiguration extends APIError {
  constructor(message: string) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR)
  }
}
