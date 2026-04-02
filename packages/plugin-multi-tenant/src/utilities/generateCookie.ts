type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  name: string
  path?: string
  returnCookieAsObject: boolean
  sameSite?: 'Lax' | 'None' | 'Strict'
  secure?: boolean
  value?: string
}

type CookieObject = {
  domain?: string
  expires?: string
  httpOnly?: boolean
  maxAge?: number
  name: string
  path?: string
  sameSite?: 'Lax' | 'None' | 'Strict'
  secure?: boolean
  value: string | undefined
}

export const generateCookie = <ReturnCookieAsObject = boolean>(
  args: CookieOptions,
): ReturnCookieAsObject extends true ? CookieObject : string => {
  const {
    name,
    domain,
    expires,
    httpOnly,
    maxAge,
    path,
    returnCookieAsObject,
    sameSite,
    secure: secureArg,
    value,
  } = args
  let cookieString = `${name}=${value || ''}`
  const cookieObject: CookieObject = {
    name,
    value,
  }
  const secure = secureArg || sameSite === 'None'

  if (expires) {
    if (returnCookieAsObject) {
      cookieObject.expires = expires.toUTCString()
    } else {
      cookieString += `; Expires=${expires.toUTCString()}`
    }
  }

  if (maxAge) {
    if (returnCookieAsObject) {
      cookieObject.maxAge = maxAge
    } else {
      cookieString += `; Max-Age=${maxAge.toString()}`
    }
  }

  if (domain) {
    if (returnCookieAsObject) {
      cookieObject.domain = domain
    } else {
      cookieString += `; Domain=${domain}`
    }
  }

  if (path) {
    if (returnCookieAsObject) {
      cookieObject.path = path
    } else {
      cookieString += `; Path=${path}`
    }
  }

  if (secure) {
    if (returnCookieAsObject) {
      cookieObject.secure = secure
    } else {
      cookieString += `; Secure`
    }
  }

  if (httpOnly) {
    if (returnCookieAsObject) {
      cookieObject.httpOnly = httpOnly
    } else {
      cookieString += `; HttpOnly`
    }
  }

  if (sameSite) {
    if (returnCookieAsObject) {
      cookieObject.sameSite = sameSite
    } else {
      cookieString += `; SameSite=${sameSite}`
    }
  }

  return returnCookieAsObject ? (cookieObject as any) : (cookieString as any)
}
