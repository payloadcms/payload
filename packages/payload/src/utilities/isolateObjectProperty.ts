/**
 * Creates a proxy for the given object that has its own property
 */
export default function isolateObjectProperty<T>(object: T, key): T {
  const delegate = {}
  const handler = {
    deleteProperty(target, p): boolean {
      return Reflect.deleteProperty(p === key ? delegate : target, p)
    },
    get(target, p, receiver) {
      return Reflect.get(p === key ? delegate : target, p, receiver)
    },
    has(target, p) {
      return Reflect.has(p === key ? delegate : target, p)
    },
    set(target, p, newValue, receiver) {
      if (p === key) {
        // in case of transactionID we must ignore any receiver, because
        // "If provided and target does not have a setter for propertyKey, the property will be set on receiver instead."
        return Reflect.set(delegate, p, newValue)
      } else {
        return Reflect.set(target, p, newValue, receiver)
      }
    },
  }
  return new Proxy(object, handler)
}
