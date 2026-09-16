import type { PayloadRequest } from '../types/index.js'

/**
 * Creates a request view with an isolated locale while preserving the original Request instance.
 * Native Request accessors and methods must use the original request as their receiver.
 */
export function getRequestWithLocale({
  locale,
  req,
}: {
  locale: string
  req: PayloadRequest
}): PayloadRequest {
  if (req.locale === locale) {
    return req
  }

  let requestLocale = locale

  return new Proxy(req, {
    get(target, property) {
      if (property === 'locale') {
        return requestLocale
      }

      const value = Reflect.get(target, property, target)

      return typeof value === 'function' ? value.bind(target) : value
    },
    set(target, property, value) {
      if (property === 'locale') {
        requestLocale = value as string
        return true
      }

      return Reflect.set(target, property, value, target)
    },
  })
}
