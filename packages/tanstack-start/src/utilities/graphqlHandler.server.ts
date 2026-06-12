import type { Payload, PayloadRequest, SanitizedConfig } from 'payload'

import {
  addDataAndFileToRequest,
  addLocalesToRequestFromData,
  createPayloadRequest,
  headersWithCors,
  logError,
  mergeHeaders,
} from 'payload'

const handleError = async ({
  err,
  payload,
  req,
}: {
  err: any
  payload: Payload
  req: PayloadRequest
}): Promise<any> => {
  const status = err.originalError?.status || 500
  let errorMessage = err.message
  logError({ err, payload })

  if (!payload.config.debug && status === 500) {
    errorMessage = 'Something went wrong.'
  }

  let response: any = {
    extensions: {
      name: err?.originalError?.name || undefined,
      data: (err && err.originalError && err.originalError.data) || undefined,
      stack: payload.config.debug ? err.stack : undefined,
      statusCode: status,
    },
    locations: err.locations,
    message: errorMessage,
    path: err.path,
  }

  await payload.config.hooks.afterError?.reduce(async (promise, hook) => {
    await promise

    const result = await hook({
      context: req.context,
      error: err,
      graphqlResult: response,
      req,
    })

    if (result) {
      response = result.graphqlResult || response
    }
  }, Promise.resolve())

  return response
}

let cached: { graphql: any; promise: null | Promise<any> } = { graphql: null, promise: null }

const getGraphql = async (config: Promise<SanitizedConfig> | SanitizedConfig) => {
  if (process.env.NODE_ENV === 'development') {
    cached = { graphql: null, promise: null }
  }

  if (cached.graphql) {
    return cached.graphql
  }

  if (!cached.promise) {
    const resolvedConfig = await config
    const graphqlPackage = '@payloadcms/graphql'
    const { configToSchema } = await import(/* @vite-ignore */ graphqlPackage)
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

/**
 * Handles GraphQL HTTP requests for TanStack Start apps.
 * Mirrors the behaviour of `@payloadcms/next`'s GraphQL route handler.
 *
 * Requires `@payloadcms/graphql` and `graphql-http` to be installed in the consuming app.
 */
export const handleGraphQL = async ({
  config,
  request,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  request: Request
}): Promise<Response> => {
  const originalRequest = request.clone()

  const req = await createPayloadRequest({
    canSetHeaders: true,
    config,
    request,
  })

  await addDataAndFileToRequest(req)
  addLocalesToRequestFromData(req)

  const { schema, validationRules } = await getGraphql(config)

  const { payload } = req

  const graphqlHttpHandlerPath = 'graphql-http/lib/use/fetch'
  const { createHandler } = await import(/* @vite-ignore */ graphqlHttpHandlerPath)

  const headers: Record<string, string> = {}
  const apiResponse = await createHandler({
    context: { headers, req },
    onOperation: async (_request: any, args: any, result: any) => {
      const response =
        typeof payload.extensions === 'function'
          ? await payload.extensions({
              args,
              req: _request,
              result,
            })
          : result
      if (response.errors) {
        const errors = await Promise.all(
          response.errors.map((error: any) => {
            return handleError({ err: error, payload, req })
          }),
        )
        return { ...response, errors }
      }
      return response
    },
    schema,
    validationRules: (_: any, args: any, defaultRules: any) =>
      defaultRules.concat(validationRules(args)),
  })(originalRequest)

  const resHeaders = headersWithCors({
    headers: new Headers(apiResponse.headers),
    req,
  })

  for (const key of Object.keys(headers)) {
    resHeaders.append(key, headers[key]!)
  }

  return new Response(apiResponse.body, {
    headers: req.responseHeaders ? mergeHeaders(req.responseHeaders, resHeaders) : resHeaders,
    status: apiResponse.status,
  })
}
