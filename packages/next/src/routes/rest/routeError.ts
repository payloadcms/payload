import type { Collection, ErrorResult, PayloadRequest, SanitizedConfig } from 'payload'

import httpStatus from 'http-status'
import { APIError, formatErrors, getPayload } from 'payload'

import { headersWithCors } from '../../utilities/headersWithCors.js'
import { mergeHeaders } from '../../utilities/mergeHeaders.js'

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
  let payload = 'payload' in incomingReq && incomingReq?.payload

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

  const req = incomingReq as PayloadRequest

  req.payload = payload
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  const { config, logger } = payload

  let response = formatErrors(err)

  let status = err.status || httpStatus.INTERNAL_SERVER_ERROR

  const level = payload.config.loggingLevels[err.name] ?? 'error'
  if (level) {
    logger[level](level === 'info' ? { msg: err.message } : { err })
  }

  // Internal server errors can contain anything, including potentially sensitive data.
  // Therefore, error details will be hidden from the response unless `config.debug` is `true`
  if (!config.debug && status === httpStatus.INTERNAL_SERVER_ERROR) {
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
