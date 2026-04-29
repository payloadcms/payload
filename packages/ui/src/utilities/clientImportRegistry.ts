export type ClientImportFactory = () => Promise<unknown>

export type ClientImportRegistry = {
  /**
   * Synchronous accessor returning the resolved module if its `resolve`
   * promise has already settled, or `null` otherwise. Used by Form's
   * `addFieldRow` to mount client custom Field components immediately on
   * ADD_ROW (skipping the default-Field flash that the async resolve +
   * MERGE_RENDERED_FIELDS cycle otherwise produces). Callers must pre-warm
   * via `resolve(path)` for paths they want to read synchronously later.
   */
  getCached(path: string): null | unknown
  has(path: string): boolean
  /** Resolves to the registered module, or `null` if `path` is not registered. */
  resolve(path: string): Promise<unknown>
}

export function createClientImportRegistry(
  factories: Record<string, ClientImportFactory>,
): ClientImportRegistry {
  const promiseCache = new Map<string, Promise<unknown>>()
  const valueCache = new Map<string, unknown>()
  return {
    getCached(path) {
      return valueCache.has(path) ? (valueCache.get(path) ?? null) : null
    },
    has(path) {
      return Object.hasOwn(factories, path)
    },
    resolve(path) {
      if (!Object.hasOwn(factories, path)) {
        return Promise.resolve(null)
      }
      if (!promiseCache.has(path)) {
        const p = factories[path]().then((value) => {
          const resolved = value ?? null
          valueCache.set(path, resolved)
          return resolved
        })
        promiseCache.set(path, p)
      }
      return promiseCache.get(path).then((value) => value ?? null)
    },
  }
}
