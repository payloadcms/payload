import type { Dispatcher } from 'undici'

import ipaddr from 'ipaddr.js'
import { Agent, fetch as undiciFetch } from 'undici'

const isSafeIp = (ip: string) => {
  try {
    if (!ip) {
      return false
    }

    if (!ipaddr.isValid(ip)) {
      return false
    }

    const parsedIpAddress = ipaddr.parse(ip)
    const range = parsedIpAddress.range()
    if (range !== 'unicast') {
      return false // Private IP Range
    }
  } catch (ignore) {
    return false
  }
  return true
}

const ssrfFilterInterceptor: Dispatcher.DispatcherComposeInterceptor = (dispatch) => {
  return (opts, handler) => {
    const url = new URL(opts.origin?.toString() + opts.path)
    if (!isSafeIp(url.hostname)) {
      throw new Error(`Blocked unsafe attempt to ${url}`)
    }
    return dispatch(opts, handler)
  }
}

const safeDispatcher = new Agent().compose(ssrfFilterInterceptor)

/**
 * A "safe" version of undici's fetch that prevents SSRF attacks.
 *
 * - Utilizes a custom dispatcher that filters out requests to unsafe IP addresses.
 * - Undici was used because it supported interceptors as well as "credentials: include". Native fetch
 */
export const safeFetch = async (...args: Parameters<typeof undiciFetch>) => {
  const [url, options] = args
  try {
    return await undiciFetch(url, {
      ...options,
      dispatcher: safeDispatcher,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.cause instanceof Error && error.cause.message.includes('unsafe')) {
        // Errors thrown from within interceptors always have 'fetch error' as the message
        // The desired message we want to bubble up is in the cause
        throw new Error(error.cause.message)
      } else {
        let stringifiedUrl: string | undefined | URL = undefined
        if (typeof url === 'string' || url instanceof URL) {
          stringifiedUrl = url
        } else if (url instanceof Request) {
          stringifiedUrl = url.url
        }

        throw new Error(`Failed to fetch from ${stringifiedUrl}, ${error.message}`)
      }
    }
    throw error
  }
}
