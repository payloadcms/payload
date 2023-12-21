import type { AuthStrategyFunctionArgs } from '.'

import { parseCookies } from '../utilities/parseCookies'

export const extractJWT = (
  args: Pick<AuthStrategyFunctionArgs, 'headers' | 'payload'>,
): null | string => {
  const { headers, payload } = args

  const jwtFromHeader = headers.get('Authorization')
  const origin = headers.get('Origin')

  if (jwtFromHeader?.startsWith('JWT ')) {
    return jwtFromHeader.replace('JWT ', '')
  }
  // allow RFC6750 OAuth 2.0 compliant Bearer tokens
  // in addition to the payload default JWT format
  if (jwtFromHeader?.startsWith('Bearer ')) {
    return jwtFromHeader.replace('Bearer ', '')
  }

  const cookies = parseCookies(headers)
  const tokenCookieName = `${payload.config.cookiePrefix}-token`
  const cookieToken = cookies.get(tokenCookieName)

  if (!cookieToken) {
    return null
  }

  if (!origin || payload.config.csrf.length === 0 || payload.config.csrf.indexOf(origin) > -1) {
    return cookieToken
  }

  return null
}
