import { APIError, type CollectionBeforeOperationHook, type Config } from '../index.js'

export const detectRecursiveHooks = (
  config: Config,
  _args: Parameters<CollectionBeforeOperationHook>[0],
): ReturnType<CollectionBeforeOperationHook> => {
  const { args, context } = _args

  if (typeof config.maxHookRecursion === 'number') {
    if (!context._invocations) {
      context._invocations = 1
    } else if (typeof context._invocations === 'number') {
      context._invocations += 1
    }

    if (
      typeof context._invocations === 'number' &&
      context._invocations > config.maxHookRecursion
    ) {
      const msg = `Max hook recursion of ${config.maxHookRecursion} exceeded. There may be a circular dependency between hooks.`
      _args.req.payload.logger.error(msg)
      throw new APIError(msg)
    }
  }

  return args
}
