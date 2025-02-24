import type { AuthStrategyFunctionArgs, AuthStrategyResult } from './index.js'
export const executeAuthStrategies = async (
  args: AuthStrategyFunctionArgs,
): Promise<AuthStrategyResult> => {
  if (!args.payload.authStrategies?.length) {
    return { user: null }
  }

  for (const strategy of args.payload.authStrategies) {
    // add the configured AuthStrategy `name` to the strategy function args
    args.strategyName = strategy.name

    const result = await strategy.authenticate(args)
    if (result.user) {
      return result
    }
  }
  return { user: null }
}
