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

    // No Origin header — browsers omit it on top-level GET navigations.
    // If csrf is not configured, there is no allowlist to enforce.
    // (csrf is auto-populated from serverURL when set — see config/sanitize.ts)
    if (payload.config.csrf.length === 0) {
      return cookieToken
    }

    const secFetchSite = headers.get('Sec-Fetch-Site')

    if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
      // same-origin/same-site: request is from the same site.
      // none: user-initiated (typed URL, bookmark, link from external app) — not CSRF.
      return cookieToken
    }

    // cross-site: the CSRF attack vector (e.g. link on evil.com to our GET endpoint).
    // absent: non-browser client or old browser — require Authorization header.
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
