import type { AuthStrategyFunctionArgs, AuthStrategyResult } from './index.js'

import { mergeHeaders } from '../utilities/mergeHeaders.js'

export const executeAuthStrategies = async (
  args: AuthStrategyFunctionArgs,
): Promise<AuthStrategyResult> => {
  return args.payload.authStrategies.reduce(
    async (accumulatorPromise, strategy) => {
      const result: AuthStrategyResult = await accumulatorPromise
      if (!result.user) {
        // add the configured AuthStrategy `name` to the strategy function args
        args.strategyName = strategy.name

        const authenticateResult = await strategy.authenticate(args)
        if (result.responseHeaders) {
          return {
            ...authenticateResult,
            responseHeaders: mergeHeaders(
              result.responseHeaders || new Headers(),
              authenticateResult.responseHeaders || new Headers(),
            ),
          }
        } else {
          return authenticateResult
        }
      }
      return result
    },
    Promise.resolve({ user: null }),
  )
}
