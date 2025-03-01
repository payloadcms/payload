import type { AuthStrategyFunctionArgs, AuthStrategyResult } from './index.js'

import { mergeHeaders } from '../utilities/mergeHeaders.js'
export const executeAuthStrategies = async (
  args: AuthStrategyFunctionArgs,
): Promise<AuthStrategyResult> => {
  let result: AuthStrategyResult = { user: null }

  if (!args.payload.authStrategies?.length) {
    return result
  }

  for (const strategy of args.payload.authStrategies) {
    // add the configured AuthStrategy `name` to the strategy function args
    args.strategyName = strategy.name

    const authResult = await strategy.authenticate(args)
    if (authResult.responseHeaders) {
      authResult.responseHeaders = mergeHeaders(
        result.responseHeaders || new Headers(),
        authResult.responseHeaders || new Headers(),
      )
    }
    result = authResult

    if (result.user) {
      return result
    }
  }
  return result
}
