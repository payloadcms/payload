import { cache } from 'react'

type CachedValue = object

// Module-scoped cache container that holds all cached, stable containers
// - these may hold the stable value, or a promise to the stable value
const globalCacheContainer: Record<
  string,
  <TValue extends object = CachedValue>(
    ...args: unknown[]
  ) => {
    value: null | Promise<TValue> | TValue
  }
> = {}

/**
 * Creates a selective cache function that provides more control over React's request-level caching behavior.
 *
 * @param namespace - A namespace to group related cached values
 * @returns A function that manages cached values within the specified namespace
 */
export function selectiveCache<TValue extends object = CachedValue>(namespace: string) {
  // Create a stable namespace container if it doesn't exist
  if (!globalCacheContainer[namespace]) {
    globalCacheContainer[namespace] = cache((...args) => ({
      value: null,
    }))
  }

  /**
   * Gets or creates a cached value for a specific key within the namespace
   *
   * @param key - The key to identify the cached value
   * @param factory - A function that produces the value if not cached
   * @returns The cached or newly created value
   */
  const getCached = async (factory: () => Promise<TValue>, ...cacheArgs): Promise<TValue> => {
    const stableObjectFn = globalCacheContainer[namespace]
    const stableObject = stableObjectFn<TValue>(...cacheArgs)

    if (
      stableObject?.value &&
      'then' in stableObject.value &&
      typeof stableObject.value?.then === 'function'
    ) {
      return await stableObject.value
    }

    stableObject.value = factory()

    return await stableObject.value
  }

  return {
    get: getCached,
  }
}
