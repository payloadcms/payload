import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class Locked extends APIError {
  constructor(message: string) {
    super(message, httpStatus.LOCKED)
  }
}
