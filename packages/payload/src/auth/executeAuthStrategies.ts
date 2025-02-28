import type { AuthStrategyFunctionArgs, AuthStrategyResult } from './index.js'
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

    result = await strategy.authenticate(args)
    if (result.user) {
      return result
    }
  }
  return result
}
