import type { Request } from 'express'

import type { SanitizedConfig } from '../config/types'

import parseCookies from '../utilities/parseCookies'

const getExtractJWT =
  (config: SanitizedConfig) =>
  (req: Request): null | string => {
    if (!req?.get) {
      return null
    }

    const jwtFromHeader = req.get('Authorization')
    const origin = req.get('Origin')

    if (jwtFromHeader?.indexOf('JWT ') === 0) {
      return jwtFromHeader.replace('JWT ', '')
    }
    // allow RFC6750 OAuth 2.0 compliant Bearer tokens
    // in addition to the payload default JWT format
    if (jwtFromHeader?.indexOf('Bearer ') === 0) {
      return jwtFromHeader.replace('Bearer ', '')
    }

    const cookies = parseCookies(req)
    const tokenCookieName = `${config.cookiePrefix}-token`

    if (!cookies?.[tokenCookieName]) {
      return null
    }

    if (!origin || config.csrf.length === 0 || config.csrf.indexOf(origin) > -1) {
      return cookies[tokenCookieName]
    }

    return null
  }

export default getExtractJWT
