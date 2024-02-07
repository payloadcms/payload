import config from 'payload-config'
import { GraphQLError } from 'graphql'
import httpStatus from 'http-status'
import type { Payload, CollectionAfterErrorHook } from 'payload/types'
import type { GraphQLFormattedError } from 'graphql'
import { createPayloadRequest } from '../../utilities/createPayloadRequest'
import { createHandler } from 'graphql-http/lib/use/fetch'
import { configToSchema } from '../schema/configToSchema'

const handleError = async (
  payload: Payload,
  err: any,
  debug: boolean,
  afterErrorHook: CollectionAfterErrorHook,
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

export const POST = async (request: Request) => {
  const originalRequest = request.clone()
  const req = await createPayloadRequest({
    request,
    config,
  })
  const resolvedConfig = await config
  const mySchema = await configToSchema(resolvedConfig)

  const { payload } = req
  const headers = new Headers()

  const afterErrorHook =
    typeof payload.config.hooks.afterError === 'function' ? payload.config.hooks.afterError : null

  const apiResponse = await createHandler({
    context: { req, headers },
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
    schema: mySchema.schema,
    validationRules: (request, args, defaultRules) =>
      defaultRules.concat(mySchema.validationRules(args)),
  })(originalRequest)

  return new Response(apiResponse.body, {
    status: apiResponse.status,
    headers: {
      ...apiResponse.headers,
      ...headers,
    },
  })
}
