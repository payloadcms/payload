import type { AuthStrategyFunctionArgs, User } from './index.d.ts'

export const getAuthenticatedUser = async (
  args: AuthStrategyFunctionArgs,
): Promise<User | null> => {
  return args.payload.authStrategies.reduce(async (accumulatorPromise, strategy) => {
    const authUser = await accumulatorPromise
    if (!authUser) {
      return strategy.authenticate(args)
    }
    return authUser
  }, Promise.resolve(null))
}
