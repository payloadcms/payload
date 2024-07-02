import type { GraphQLError, GraphQLFormattedError } from 'graphql'
import type { CollectionAfterErrorHook, Payload, SanitizedConfig } from 'payload'

import { configToSchema } from '@payloadcms/graphql'
import { createHandler } from 'graphql-http/lib/use/fetch'
import httpStatus from 'http-status'

import { addDataAndFileToRequest } from '../../utilities/addDataAndFileToRequest.js'
import { addLocalesToRequestFromData } from '../../utilities/addLocalesToRequest.js'
import { createPayloadRequest } from '../../utilities/createPayloadRequest.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { mergeHeaders } from '../../utilities/mergeHeaders.js'

const handleError = async (
  payload: Payload,
  err: any,
  debug: boolean,
  afterErrorHook: CollectionAfterErrorHook,
  // eslint-disable-next-line @typescript-eslint/require-await
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
    ;({ response } = afterErrorHook(err, response, null, null) || { response })
  }

  return response
}

let cached = global._payload_graphql

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload_graphql = { graphql: null, promise: null }
}

export const getGraphql = async (config: Promise<SanitizedConfig> | SanitizedConfig) => {
  if (process.env.NODE_ENV === 'development') {
    cached = global._payload_graphql = { graphql: null, promise: null }
  }

  if (cached.graphql) {
    return cached.graphql
  }

  if (!cached.promise) {
    const resolvedConfig = await config
    cached.promise = new Promise((resolve) => {
      const schema = configToSchema(resolvedConfig)
      resolve(cached.graphql || schema)
    })
  }

  try {
    cached.graphql = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.graphql
}

export const POST =
  (config: Promise<SanitizedConfig> | SanitizedConfig) => async (request: Request) => {
    const originalRequest = request.clone()
    const req = await createPayloadRequest({
      config,
      request,
    })

    await addDataAndFileToRequest(req)
    addLocalesToRequestFromData(req)

    const { schema, validationRules } = await getGraphql(config)

    const { payload } = req

    const afterErrorHook =
      typeof payload.config.hooks.afterError === 'function' ? payload.config.hooks.afterError : null

    const headers = {}
    const apiResponse = await createHandler({
      context: { headers, req },
      onOperation: async (request, args, result) => {
        const response =
          typeof payload.extensions === 'function'
            ? await payload.extensions({
                args,
                req: request,
                result,
              })
            : result
        if (response.errors) {
          const errors = (await Promise.all(
            result.errors.map((error) => {
              return handleError(payload, error, payload.config.debug, afterErrorHook)
            }),
          )) as GraphQLError[]
          // errors type should be FormattedGraphQLError[] but onOperation has a return type of ExecutionResult instead of FormattedExecutionResult
          return { ...response, errors }
        }
        return response
      },
      schema,
      validationRules: (_, args, defaultRules) => defaultRules.concat(validationRules(args)),
    })(originalRequest)

    const resHeaders = headersWithCors({
      headers: new Headers(apiResponse.headers),
      req,
    })

    for (const key in headers) {
      resHeaders.append(key, headers[key])
    }

    if (req.responseHeaders) {
      mergeHeaders(req.responseHeaders, resHeaders)
    }

    return new Response(apiResponse.body, {
      headers: resHeaders,
      status: apiResponse.status,
    })
  }
