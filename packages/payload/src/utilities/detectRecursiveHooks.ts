import type {
  CollectionBeforeOperationHook,
  CollectionSlug,
  Config,
  HookOperationType,
} from '../index.js'

import { APIError } from '../index.js'

type InvocationContext = {
  _invocations: {
    [key: CollectionSlug]: Partial<Record<HookOperationType, number>>
  }
}

/**
 * Tracks the number of invocations of hooks per collection and operation in the request context.
 * If the number of invocations exceeds the configured maximum, an error is thrown to prevent infinite loops.
 * To enable, set the `hooksMaxRecursion` property in the Payload config to a number greater than 0.
 * @example
 * // This what this hook tracks via context
 * {
 *  _invocations: {
 *   posts: {
 *    create: 1,
 *    update: 2
 *   }
 *  }
 * }
 */
export const detectRecursiveHooks = (
  config: Config,
  _args: Parameters<CollectionBeforeOperationHook>[0],
): ReturnType<CollectionBeforeOperationHook> => {
  const { args, collection, operation } = _args

  const context = _args.context as InvocationContext

  if (typeof config.hooksMaxRecursion === 'number') {
    if (!context._invocations) {
      context._invocations = {
        [collection.slug]: {
          [operation]: 1,
        },
      }
    } else if (typeof context._invocations === 'object') {
      if (!context._invocations[collection.slug]) {
        context._invocations[collection.slug] = {
          [operation]: 1,
        }
      }

      context._invocations[collection.slug]![operation] =
        (context._invocations[collection.slug]![operation] ?? 0) + 1
    }

    if (
      context._invocations[collection.slug] &&
      typeof context._invocations[collection.slug]![operation] === 'number' &&
      context._invocations[collection.slug]![operation]! > config.hooksMaxRecursion
    ) {
      const msg = `Maximum number of hooks invoked on collection '${collection.slug}' for operation '${operation}'. There may be a circular dependency between hooks.`
      _args.req.payload.logger.error(msg)
      throw new APIError(msg)
    }
  }

  return args
}
