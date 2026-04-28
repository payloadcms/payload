export type ClientImportFactory = () => Promise<unknown>

export type ClientImportRegistry = {
  has(path: string): boolean
  resolve(path: string): Promise<unknown>
}

export function createClientImportRegistry(
  factories: Record<string, ClientImportFactory>,
): ClientImportRegistry {
  const cache = new Map<string, Promise<unknown>>()
  return {
    has(path) {
      return Object.hasOwn(factories, path)
    },
    resolve(path) {
      if (!Object.hasOwn(factories, path)) {
        return Promise.resolve(null)
      }
      if (!cache.has(path)) {
        cache.set(path, factories[path]())
      }
      return cache.get(path).then((value) => value ?? null)
    },
  }
}
