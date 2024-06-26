import type { TypedUser } from '../index.js'
import type { AuthStrategyFunctionArgs } from './index.js'

export const executeAuthStrategies = async (
  args: AuthStrategyFunctionArgs,
): Promise<TypedUser | null> => {
  return args.payload.authStrategies.reduce(async (accumulatorPromise, strategy) => {
    const authUser = await accumulatorPromise
    if (!authUser) {
      return strategy.authenticate(args)
    }
    return authUser
  }, Promise.resolve(null))
}
