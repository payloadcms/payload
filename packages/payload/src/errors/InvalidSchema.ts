import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class InvalidSchema extends APIError {
  constructor(message: string, results: any) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR, results)
  }
}
