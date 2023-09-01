import httpStatus from 'http-status'

import APIError from './APIError'

class InvalidConfiguration extends APIError {
  constructor(message: string) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR)
  }
}

export default InvalidConfiguration
