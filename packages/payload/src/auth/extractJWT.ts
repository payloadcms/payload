import type { BasePayload } from '../index.js'
import type { AuthStrategyFunctionArgs } from './index.js'

import { parseCookies } from '../utilities/parseCookies.js'

type ExtractionMethod = (args: { headers: Headers; payload: BasePayload }) => null | string

const extractionMethods: Record<string, ExtractionMethod> = {
  Bearer: ({ headers }) => {
    const jwtFromHeader = headers.get('Authorization')

    // allow RFC6750 OAuth 2.0 compliant Bearer tokens
    // in addition to the payload default JWT format
    if (jwtFromHeader?.startsWith('Bearer ')) {
      return jwtFromHeader.replace('Bearer ', '')
    }

    return null
  },
  cookie: ({ headers, payload }) => {
    const cookies = parseCookies(headers)
    const tokenCookieName = `${payload.config.cookiePrefix}-token`
    const cookieToken = cookies.get(tokenCookieName)

    if (!cookieToken) {
      return null
    }

    const origin = headers.get('Origin')

    // If Origin is present, validate against csrf allowlist
    if (origin) {
      if (payload.config.csrf.length === 0 || payload.config.csrf.includes(origin)) {
        return cookieToken
      }
      return null
    }

    // No Origin header - use Sec-Fetch-Site to determine request context
    const secFetchSite = headers.get('Sec-Fetch-Site')

    // Browser indicates same-origin/same-site → safe
    if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
      return cookieToken
    }

    // Browser indicates no context → reject (could be CSRF or non-browser client)
    if (secFetchSite === 'none') {
      return null
    }

    // Browser indicates cross-site → reject
    if (secFetchSite === 'cross-site') {
      return null
    }

    // No Origin, no Sec-Fetch-Site (non-browser or old browser)
    // If csrf is configured, require explicit auth header
    if (payload.config.csrf.length > 0) {
      return null
    }

    // No csrf configured → allow (user opted out of csrf protection)
    return cookieToken
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
  const { headers, payload } = args

  const extractionOrder = payload.config.auth.jwtOrder

  for (const extractionStrategy of extractionOrder) {
    const result = extractionMethods[extractionStrategy]!({ headers, payload })

    if (result) {
      return result
    }
  }

  return null
}
