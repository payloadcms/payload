import type { BasePayload } from '../index.js'
import type { AuthStrategyFunctionArgs } from './index.js'

import { parseCookies } from '../utilities/parseCookies.js'

type ExtractJWTArgs = { method?: string } & Omit<AuthStrategyFunctionArgs, 'strategyName'>

type ExtractionMethod = (args: {
  headers: Headers
  method?: string
  payload: BasePayload
}) => null | string

const SAFE_METHODS = ['GET', 'HEAD']

const isSafeMethod = (method: string): boolean => SAFE_METHODS.includes(method.toUpperCase())

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

  return !method || isSafeMethod(method)
}

/**
 * Reads the token from an `Authorization: Bearer <token>` header (RFC 6750). The scheme is
 * case-insensitive and may be followed by more than one space.
 */
export const extractBearerToken = ({ headers }: { headers: Headers }): null | string =>
  headers.get('Authorization')?.match(/^Bearer +(\S+)$/i)?.[1] ?? null

const extractionMethods: Record<string, ExtractionMethod> = {
  Bearer: extractBearerToken,
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
    const secFetchMode = headers.get('Sec-Fetch-Mode')

    // Allow same-origin, same-site, direct navigations (none), and cross-site navigation (e.g., email links)
    if (
      secFetchSite === 'same-origin' ||
      secFetchSite === 'same-site' ||
      secFetchSite === 'none' ||
      secFetchMode === 'navigate'
    ) {
      return cookieToken
    }

    if (secFetchSite === 'cross-site' && isSafeTopLevelNavigation({ headers, method })) {
      return cookieToken
    }

    const isIframeNavigation =
      secFetchSite === 'cross-site' &&
      headers.get('Sec-Fetch-Mode') === 'navigate' &&
      headers.get('Sec-Fetch-Dest') === 'iframe' &&
      (!method || isSafeMethod(method))

    // Even same-origin navigations can lack Sec-Fetch-Site over plain HTTP outside localhost.
    // When it's missing, or for a cross-site iframe navigation, require a Referer origin listed in csrf.
    if (!secFetchSite || isIframeNavigation) {
      const referer = headers.get('Referer')

      if (referer) {
        try {
          if (payload.config.csrf.includes(new URL(referer).origin)) {
            return cookieToken
          }
        } catch {
          // Malformed Referer — fall through to reject
        }
      }
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

export const extractJWT = (args: ExtractJWTArgs): null | string => {
  const { headers, payload, req } = args
  const method = req?.method ?? args.method

  const extractionOrder = payload.config.auth.jwtOrder

  for (const extractionStrategy of extractionOrder) {
    const result = extractionMethods[extractionStrategy]!({
      headers,
      method,
      payload,
    })

    if (result) {
      return result
    }
  }

  return null
}
