import type { Dispatcher } from 'undici'

import { lookup } from 'dns/promises'
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

/**
 * Checks if a hostname or IP address is safe to fetch from.
 * @param hostname a hostname or IP address
 * @returns
 */
const isSafe = async (hostname: string) => {
  try {
    if (ipaddr.isValid(hostname)) {
      return isSafeIp(hostname)
    }

    const { address } = await lookup(hostname)
    return isSafeIp(address)
  } catch (_ignore) {
    return false
  }
}

const ssrfFilterInterceptor: Dispatcher.DispatcherComposeInterceptor = (dispatch) => {
  return (opts, handler) => {
    return dispatch(opts, handler)
  }
}

const safeDispatcher = new Agent().compose(ssrfFilterInterceptor)

/**
 * A "safe" version of undici's fetch that prevents SSRF attacks.
 *
 * - Utilizes a custom dispatcher that filters out requests to unsafe IP addresses.
 * - Validates domain names by resolving them to IP addresses and checking if they're safe.
 * - Undici was used because it supported interceptors as well as "credentials: include". Native fetch
 */
export const safeFetch = async (...args: Parameters<typeof undiciFetch>) => {
  const [unverifiedUrl, options] = args

  try {
    const url = new URL(unverifiedUrl)

    const isHostnameSafe = await isSafe(url.hostname)
    if (!isHostnameSafe) {
      throw new Error(`Blocked unsafe attempt to ${url.toString()}`)
    }

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
        let stringifiedUrl: string | undefined = undefined
        if (typeof unverifiedUrl === 'string') {
          stringifiedUrl = unverifiedUrl
        } else if (unverifiedUrl instanceof URL) {
          stringifiedUrl = unverifiedUrl.toString()
        } else if (unverifiedUrl instanceof Request) {
          stringifiedUrl = unverifiedUrl.url
        }

        throw new Error(`Failed to fetch from ${stringifiedUrl}, ${error.message}`)
      }
    }
    throw error
  }
}
