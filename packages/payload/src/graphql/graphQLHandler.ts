import type { Response } from 'express'
import type { GraphQLError } from 'graphql'

import { createHandler } from 'graphql-http/lib/use/express'

import type { PayloadRequest } from '../express/types'

import errorHandler from './errorHandler'

const graphQLHandler = (req: PayloadRequest, res: Response) => {
  const { payload } = req

  const afterErrorHook =
    typeof payload.config.hooks.afterError === 'function' ? payload.config.hooks.afterError : null

  return createHandler({
    context: { req, res },
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
            return errorHandler(payload, error, payload.config.debug, afterErrorHook)
          }),
        )) as GraphQLError[]
        // errors type should be FormattedGraphQLError[] but onOperation has a return type of ExecutionResult instead of FormattedExecutionResult
        return { ...response, errors }
      }
      return response
    },
    schema: payload.schema,
    validationRules: (request, args, defaultRules) =>
      defaultRules.concat(payload.validationRules(args)),
  })
}

export default graphQLHandler
