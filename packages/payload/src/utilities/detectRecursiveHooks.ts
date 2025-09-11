import type {
  CollectionBeforeOperationHook,
  CollectionSlug,
  Config,
  GlobalBeforeOperationHook,
  HookOperationType,
} from '../index.js'

import { APIError } from '../index.js'

type InvocationContext = {
  _invocations: {
    [key: CollectionSlug]: Partial<Record<HookOperationType, number>>
  }
}

/**
 * Tracks the number of operations a hook invokes within a request.
 * If the number of invocations exceeds the configured maximum, an error is thrown to prevent infinite loops.
 * To enable, set the `hooksMaxRecursion` property in the Payload config to a number greater than 0.
 *
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
 *
 * @see https://payloadcms.com/docs/hooks/context#hooksMaxRecursion
 */
export const detectRecursiveHooks = (
  config: Config,
  _args: Parameters<CollectionBeforeOperationHook>[0] | Parameters<GlobalBeforeOperationHook>[0],
): ReturnType<CollectionBeforeOperationHook | GlobalBeforeOperationHook> => {
  const { args, operation } = _args

  const isCollection = 'collection' in _args
  const isGlobal = 'global' in _args

  const entitySlug = isCollection ? _args.collection.slug : isGlobal ? _args.global.slug : null

  if (!entitySlug) {
    return args
  }

  const context = _args.context as InvocationContext

  if (typeof config.hooksMaxRecursion === 'number') {
    if (!context._invocations) {
      context._invocations = {
        [entitySlug]: {
          [operation]: 1,
        },
      }
    } else if (typeof context._invocations === 'object') {
      if (!context._invocations[entitySlug]) {
        context._invocations[entitySlug] = {
          [operation]: 1,
        }
      }

      context._invocations[entitySlug][operation] =
        (context._invocations[entitySlug][operation] ?? 0) + 1
    }

    if (
      context._invocations[entitySlug] &&
      typeof context._invocations[entitySlug][operation] === 'number' &&
      context._invocations[entitySlug][operation] > config.hooksMaxRecursion
    ) {
      const msg = `Maximum number of ${operation} operations exceeded for this request. There may be a circular dependency between hooks. Check the '${entitySlug}' ${isCollection ? 'collection' : 'global'} for potential leaks. See https://payloadcms.com/docs/hooks/context#hooksMaxRecursion for more info.`
      _args.req.payload.logger.error(msg)
      throw new APIError(msg)
    }
  }

  return args
}
