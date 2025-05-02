import { status as httpStatus } from 'http-status'

import type { Collection } from '../collections/config/types.js'
import type { ErrorResult, SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/APIError.js'
import { getPayload } from '../index.js'
import { formatErrors } from './formatErrors.js'
import { headersWithCors } from './headersWithCors.js'
import { logError } from './logError.js'
import { mergeHeaders } from './mergeHeaders.js'

export const routeError = async ({
  collection,
  config: configArg,
  err,
  req: incomingReq,
}: {
  collection?: Collection
  config: Promise<SanitizedConfig> | SanitizedConfig
  err: APIError
  req: PayloadRequest | Request
}) => {
  if ('payloadInitError' in err && err.payloadInitError === true) {
    // do not attempt initializing Payload if the error is due to a failed initialization. Otherwise,
    // it will cause an infinite loop of initialization attempts and endless error responses, without
    // actually logging the error, as the error logging code will never be reached.
    console.error(err)
    return Response.json(
      {
        message: 'There was an error initializing Payload',
      },
      { status: httpStatus.INTERNAL_SERVER_ERROR },
    )
  }

  let payload = incomingReq && 'payload' in incomingReq && incomingReq?.payload

  if (!payload) {
    try {
      payload = await getPayload({ config: configArg })
    } catch (e) {
      return Response.json(
        {
          message: 'There was an error initializing Payload',
        },
        { status: httpStatus.INTERNAL_SERVER_ERROR },
      )
    }
  }

  let response = formatErrors(err)

  let status = err.status || httpStatus.INTERNAL_SERVER_ERROR

  logError({ err, payload })

  const req = incomingReq as PayloadRequest

  req.payload = payload
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  const { config } = payload

  // Internal server errors can contain anything, including potentially sensitive data.
  // Therefore, error details will be hidden from the response unless `config.debug` is `true`
  if (!config.debug && !err.isPublic && status === httpStatus.INTERNAL_SERVER_ERROR) {
    response = formatErrors(new APIError('Something went wrong.'))
  }

  if (config.debug && config.debug === true) {
    response.stack = err.stack
  }

  if (collection) {
    await collection.config.hooks.afterError?.reduce(async (promise, hook) => {
      await promise

      const result = await hook({
        collection: collection.config,
        context: req.context,
        error: err,
        req,
        result: response,
      })

      if (result) {
        response = (result.response as ErrorResult) || response
        status = result.status || status
      }
    }, Promise.resolve())
  }

  await config.hooks.afterError?.reduce(async (promise, hook) => {
    await promise

    const result = await hook({
      collection: collection?.config,
      context: req.context,
      error: err,
      req,
      result: response,
    })

    if (result) {
      response = (result.response as ErrorResult) || response
      status = result.status || status
    }
  }, Promise.resolve())

  return Response.json(response, {
    headers: req.responseHeaders ? mergeHeaders(req.responseHeaders, headers) : headers,
    status,
  })
}
