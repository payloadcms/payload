import type { BasePayload } from '../index.js'
import type { AuthStrategyFunctionArgs } from './index.js'

import { parseCookies } from '../utilities/parseCookies.js'

type ExtractionMethod = (args: {
  headers: Headers
  method?: string
  payload: BasePayload
}) => null | string

const SAFE_METHODS = ['GET', 'HEAD']

/**
 * A cross-site top-level navigation (link click, or the redirect back from an identity
 * provider) is not a CSRF vector per the Fetch Metadata Resource Isolation Policy, as long
 * as it uses a safe method. Browsers always send `Origin` on non-GET/HEAD requests, so when
 * `method` is unknown (e.g. server-rendered pages) the missing `Origin` already implies a safe method.
 */
const isSafeTopLevelNavigation = ({
  headers,
  method,
}: {
  headers: Headers
  method?: string
}): boolean => {
  if (headers.get('Sec-Fetch-Mode') !== 'navigate') {
    return false
  }

  if (headers.get('Sec-Fetch-Dest') !== 'document') {
    return false
  }

  return !method || SAFE_METHODS.includes(method.toUpperCase())
}

const extractionMethods: Record<string, ExtractionMethod> = {
  Bearer: ({ headers }) => {
    const jwtFromHeader = headers.get('Authorization')

    // RFC6750 OAuth 2.0 Bearer token
    if (jwtFromHeader?.startsWith('Bearer ')) {
      return jwtFromHeader.replace('Bearer ', '')
    }

    return null
  },
  cookie: ({ headers, method, payload }) => {
    const cookies = parseCookies(headers)
    const tokenCookieName = `${payload.config.cookiePrefix}-token`
    const cookieToken = cookies.get(tokenCookieName)

    if (!cookieToken) {
      return null
    }

    const origin = headers.get('Origin')

    // Origin present — validate against csrf allowlist
    if (origin) {
      if (payload.config.csrf.length === 0 || payload.config.csrf.includes(origin)) {
        return cookieToken
      }
      return null
    }

    // No Origin and no csrf configured — no allowlist to enforce
    if (payload.config.csrf.length === 0) {
      return cookieToken
    }

    // No Origin with csrf configured — fall back to Sec-Fetch-Site
    const secFetchSite = headers.get('Sec-Fetch-Site')

    // Allow same-origin, same-site, and direct navigations (none)
    if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
      return cookieToken
    }

    if (secFetchSite === 'cross-site' && isSafeTopLevelNavigation({ headers, method })) {
      return cookieToken
    }

    // Reject other cross-site requests and missing header (non-browser clients)
    return null
  },
  JWT: ({ headers }) => {
    const jwtFromHeader = headers.get('Authorization')

    if (jwtFromHeader?.startsWith('JWT ')) {
      return jwtFromHeader.replace('JWT ', '')
    }

    return null
  },
}

export const extractJWT = (args: Omit<AuthStrategyFunctionArgs, 'strategyName'>): null | string => {
  const { headers, payload, req } = args
  const method = req?.method

  const extractionOrder = payload.config.auth.jwtOrder

  for (const extractionStrategy of extractionOrder) {
    const result = extractionMethods[extractionStrategy]!({ headers, method, payload })

    if (result) {
      return result
    }
  }

  return null
}
