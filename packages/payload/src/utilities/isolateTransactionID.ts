import type { PayloadRequest } from '../express/types'

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
      return Reflect.set(p === 'transactionID' ? delegate : target, p, newValue, receiver)
    },
  }
  return new Proxy(req, handler)
}
