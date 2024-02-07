import type { PayloadRequest } from 'payload/types'

/**
 * Creates a proxy for the given request that has its own TransactionID
 */
export default function isolateTransactionID(req: PayloadRequest): PayloadRequest {
  const delegate = {}
  const handler: ProxyHandler<PayloadRequest> = {
    deleteProperty(target, p): boolean {
      return Reflect.deleteProperty(p === 'transactionID' ? delegate : target, p)
    },
    get(target, p, receiver) {
      return Reflect.get(p === 'transactionID' ? delegate : target, p, receiver)
    },
    has(target, p) {
      return Reflect.has(p === 'transactionID' ? delegate : target, p)
    },
    set(target, p, newValue, receiver) {
      if (p === 'transactionID') {
        // in case of transactionID we must ignore any receiver, because
        // "If provided and target does not have a setter for propertyKey, the property will be set on receiver instead."
        return Reflect.set(delegate, p, newValue)
      } else {
        return Reflect.set(target, p, newValue, receiver)
      }
    },
  }
  return new Proxy(req, handler)
}
