import type { NextFunction, Response } from 'express'
import type { Logger } from 'pino'

import httpStatus from 'http-status'

import type { SanitizedConfig } from '../../config/types'
import type { ErrorResponse } from '../responses/formatError'
import type { PayloadRequest } from '../types'

import APIError from '../../errors/APIError'
import formatErrorResponse from '../responses/formatError'

export type ErrorHandler = (
  err: APIError,
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
) => Promise<Response<ErrorResponse> | void>

// NextFunction must be passed for Express to use this middleware as error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler =
  (config: SanitizedConfig, logger: Logger) =>
  async (
    err: APIError,
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response<ErrorResponse> | void> => {
    let response = formatErrorResponse(err)
    let status = err.status || httpStatus.INTERNAL_SERVER_ERROR

    logger.error(err.stack)

    // Internal server errors can contain anything, including potentially sensitive data.
    // Therefore, error details will be hidden from the response unless `config.debug` is `true`
    if (!config.debug && status === httpStatus.INTERNAL_SERVER_ERROR) {
      response = formatErrorResponse(new APIError('Something went wrong.'))
    }

    if (config.debug && config.debug === true) {
      response.stack = err.stack
    }

    if (req.collection && typeof req.collection.config.hooks.afterError === 'function') {
      ;({ response, status } = (await req.collection.config.hooks.afterError(
        err,
        response,
        req.context,
        req.collection.config,
      )) || { response, status })
    }

    if (typeof config.hooks.afterError === 'function') {
      ;({ response, status } = (await config.hooks.afterError(
        err,
        response,
        req.context,
        null,
      )) || {
        response,
        status,
      })
    }

    res.status(status).send(response)
  }

export default errorHandler
