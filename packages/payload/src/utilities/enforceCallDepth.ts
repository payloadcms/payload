import { AsyncLocalStorage } from 'async_hooks'

import type { Payload } from '../types/index.js'

import { ReachedMaxCallDepth } from '../errors/index.js'

const callDepthAls = new AsyncLocalStorage<{ currentDepth: number }>()

export const enforceCallDepth = <
  T extends (payload: Payload, options: unknown) => Promise<unknown>,
>(
  operation: T,
): T => {
  const withEnforcedCallDepth = async (payload: Payload, options: unknown) => {
    const {
      config: { maxCallDepth },
    } = payload

    if (maxCallDepth === false) {
      return operation(payload, options)
    }

    const store = callDepthAls.getStore()

    return callDepthAls.run({ currentDepth: store?.currentDepth ?? 0 }, async () => {
      const store = callDepthAls.getStore()
      store.currentDepth++
      if (store.currentDepth > maxCallDepth) {
        throw new ReachedMaxCallDepth(maxCallDepth)
      }

      return operation(payload, options)
    })
  }

  return withEnforcedCallDepth as T
}
