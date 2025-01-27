import type { GraphQLFormattedError } from 'graphql'

import httpStatus from 'http-status'

import type { AfterErrorHook } from '../collections/config/types'
import type { Payload } from '../payload'

const errorHandler = async (
  payload: Payload,
  err: any,
  debug: boolean,
  afterErrorHook: AfterErrorHook,
): Promise<GraphQLFormattedError> => {
  const status = err.originalError.status || httpStatus.INTERNAL_SERVER_ERROR
  let errorMessage = err.message

  payload.logger.error(err.stack)

  // Internal server errors can contain anything, including potentially sensitive data.
  // Therefore, error details will be hidden from the response unless `config.debug` is `true`
  if (!debug && status === httpStatus.INTERNAL_SERVER_ERROR) {
    errorMessage = 'Something went wrong.'
  }

  let response: GraphQLFormattedError = {
    extensions: {
      name: err?.originalError?.name || undefined,
      data: (err && err.originalError && err.originalError.data) || undefined,
      stack: debug ? err.stack : undefined,
      statusCode: status,
    },
    locations: err.locations,
    message: errorMessage,
    path: err.path,
  }

  if (afterErrorHook) {
    ;({ response } = (await afterErrorHook(err, response, null, null)) || { response })
  }

  return response
}

export default errorHandler
