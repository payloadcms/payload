import type { Collection, ErrorResult, PayloadRequest, SanitizedConfig } from 'payload'

import httpStatus from 'http-status'
import { APIError, APIErrorName, ValidationErrorName } from 'payload'

import { getPayloadHMR } from '../../utilities/getPayloadHMR.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { mergeHeaders } from '../../utilities/mergeHeaders.js'

const formatErrors = (incoming: { [key: string]: unknown } | APIError): ErrorResult => {
  if (incoming) {
    // Cannot use `instanceof` to check error type: https://github.com/microsoft/TypeScript/issues/13965
    // Instead, get the prototype of the incoming error and check its constructor name
    const proto = Object.getPrototypeOf(incoming)

    // Payload 'ValidationError' and 'APIError'
    if (
      (proto.constructor.name === ValidationErrorName || proto.constructor.name === APIErrorName) &&
      incoming.data
    ) {
      return {
        errors: [
          {
            name: incoming.name,
            data: incoming.data,
            message: incoming.message,
          },
        ],
      }
    }

    // Mongoose 'ValidationError': https://mongoosejs.com/docs/api/error.html#Error.ValidationError
    if (proto.constructor.name === ValidationErrorName && 'errors' in incoming && incoming.errors) {
      return {
        errors: Object.keys(incoming.errors).reduce((acc, key) => {
          acc.push({
            field: incoming.errors[key].path,
            message: incoming.errors[key].message,
          })
          return acc
        }, []),
      }
    }

    if (Array.isArray(incoming.message)) {
      return {
        errors: incoming.message,
      }
    }

    if (incoming.name) {
      return {
        errors: [
          {
            message: incoming.message,
          },
        ],
      }
    }
  }

  return {
    errors: [
      {
        message: 'An unknown error occurred.',
      },
    ],
  }
}

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
      payload = await getPayloadHMR({ config: configArg })
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

  logger.error(err.stack)

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
