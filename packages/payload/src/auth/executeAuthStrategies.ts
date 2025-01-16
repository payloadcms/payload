import type { AuthStrategyFunctionArgs, AuthStrategyResult } from './index.js'

export const executeAuthStrategies = async (
  args: AuthStrategyFunctionArgs,
): Promise<AuthStrategyResult> => {
  return args.payload.authStrategies.reduce(
    async (accumulatorPromise, strategy) => {
      const result: AuthStrategyResult = await accumulatorPromise
      if (!result.user) {
        // add the configured AuthStrategy `name` to the strategy function args
        args.strategyName = strategy.name

        return strategy.authenticate(args)
      }
      return result
    },
    Promise.resolve({ user: null }),
  )
}
