/**
 * Creates a proxy for the given object that has its own property
 */
export function isolateObjectProperty<T extends object>(object: T, key: (keyof T)[] | keyof T): T {
  const keys = Array.isArray(key) ? key : [key]
  const delegate = {} as T

  // Initialize delegate with the keys, if they exist in the original object
  for (const k of keys) {
    if (k in object) {
      delegate[k] = object[k]
    }
  }

  const handler: ProxyHandler<T> = {
    deleteProperty(target, p): boolean {
      return Reflect.deleteProperty(keys.includes(p as keyof T) ? delegate : target, p)
    },
    get(target, p, receiver) {
      if (keys.includes(p as keyof T)) {
        return Reflect.get(delegate, p, receiver)
      }
      // Use target as receiver to preserve private field access (e.g., Request#headers in Node 24+)
      const value = Reflect.get(target, p, target)
      // Methods must run against the target: invoked as proxy.method(), `this`
      // would be the proxy and private field access (e.g., Request#text reading
      // #state in undici) throws "Cannot read private member".
      if (typeof value === 'function') {
        return value.bind(target)
      }
      return value
    },
    getOwnPropertyDescriptor(target, p) {
      if (keys.includes(p as keyof T)) {
        const descriptor = Reflect.getOwnPropertyDescriptor(delegate, p)

        if (descriptor) {
          const targetDescriptor = Reflect.getOwnPropertyDescriptor(target, p)

          // A key held only in the delegate is not an own property of the
          // target, so it can only be reported as configurable. Keep the
          // target's configurability when it also holds the key.
          return {
            ...descriptor,
            configurable: targetDescriptor ? targetDescriptor.configurable : true,
          }
        }

        const targetDescriptor = Reflect.getOwnPropertyDescriptor(target, p)

        // An isolated key missing from the delegate counts as absent,
        // unless the target holds it as non-configurable, which a proxy
        // is not allowed to hide.
        return targetDescriptor && !targetDescriptor.configurable ? targetDescriptor : undefined
      }
      return Reflect.getOwnPropertyDescriptor(target, p)
    },
    has(target, p) {
      return Reflect.has(keys.includes(p as keyof T) ? delegate : target, p)
    },
    ownKeys(target) {
      const targetKeys = Reflect.ownKeys(target)

      // Extra keys can only be reported when the target is extensible,
      // otherwise the result must match the target's keys exactly.
      if (!Object.isExtensible(target)) {
        return targetKeys
      }

      return [...targetKeys, ...Reflect.ownKeys(delegate).filter((k) => !targetKeys.includes(k))]
    },
    set(target, p, newValue, _receiver) {
      if (keys.includes(p as keyof T)) {
        // in case of transactionID we must ignore any receiver, because
        // "If provided and target does not have a setter for propertyKey, the property will be set on receiver instead."
        return Reflect.set(delegate, p, newValue)
      }
      return Reflect.set(target, p, newValue, target)
    },
  }
  return new Proxy(object, handler)
}
