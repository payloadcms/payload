import type { CollectionBeforeOperationHook, Plugin } from 'payload'

import { APIError } from 'payload'

type Args = {
  max?: number
  warnAt?: number
}

export const opsCounterPlugin =
  (args?: Args): Plugin =>
  (config) => {
    const max = args?.max || 50
    const warnAt = args?.warnAt || 10

    const beforeOperationHook: CollectionBeforeOperationHook = ({
      req,
      collection,
      operation,
      args,
    }) => {
      const currentCount = req.context.opsCount

      if (typeof currentCount === 'number') {
        req.context.opsCount = currentCount + 1

        if (warnAt && currentCount >= warnAt) {
          req.payload.logger.error(
            `Detected a ${operation} in the "${collection.slug}" collection which has run ${warnAt} times or more.`,
          )
        }

        if (currentCount > max) {
          throw new APIError(`Maximum operations of ${max} detected.`)
        }
      } else {
        req.context.opsCount = 1
      }
    }

    ;(config.collections || []).forEach((collection) => {
      if (!collection.hooks) {
        collection.hooks = {}
      }
      if (!collection.hooks.beforeOperation) {
        collection.hooks.beforeOperation = []
      }

      collection.hooks.beforeOperation.push(beforeOperationHook)
    })
    return config
  }
