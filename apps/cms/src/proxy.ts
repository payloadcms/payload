import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { isTwoFactorCookieValid, TWO_FACTOR_COOKIE } from './twoFactor/cookie'

/**
 * Two-factor gate. Every admin and API request that carries a login token must also carry a
 * two-factor cookie for that login session (set by /api/users/2fa/verify or /enable). Otherwise
 * admin pages redirect to /admin/2fa and everything else is refused. Requests without a login
 * token (e.g. the website reading published posts) pass through to Payload's access control.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token =
    request.cookies.get('payload-token')?.value ||
    request.headers.get('authorization')?.match(/^(?:JWT|Bearer)\s+(\S+)$/i)?.[1]

  if (!token || ALLOWED_UNVERIFIED.some((path) => path.test(pathname))) {
    return NextResponse.next()
  }

  const session = readSession({ token })

  // Not a login token: Payload rejects it on its own
  if (!session) {
    return NextResponse.next()
  }

  if (isTwoFactorCookieValid({ session, value: request.cookies.get(TWO_FACTOR_COOKIE)?.value })) {
    return NextResponse.next()
  }

  const isPageRequest =
    request.method === 'GET' && pathname.startsWith('/admin') && !request.headers.has('next-action')

  if (isPageRequest) {
    const url = new URL('/admin/2fa', request.url)
    url.searchParams.set('redirect', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  return NextResponse.json(
    { errors: [{ message: 'Two-factor authentication required.' }] },
    { status: 403 },
  )
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}

/** What a logged-in session may use before its code is entered: logging in or out, and the 2FA page */
const ALLOWED_UNVERIFIED = [
  /^\/admin\/(?:2fa|create-first-user|forgot|login|logout|logout-inactivity|reset)(?:\/|$)/,
  /^\/api\/users\/(?:2fa|first-register|forgot-password|login|logout|me|refresh-token|reset-password)(?:\/|$)/,
  /^\/api\/health$/,
]

/**
 * Reads the user and login session from Payload's token without checking its signature: Payload
 * checks it on every request, and the two-factor cookie can't be forged for another session.
 */
const readSession = ({ token }: { token: string }) => {
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64url').toString()) as {
      id?: number | string
      sid?: string
    }

    return claims.id ? { sid: claims.sid, userID: claims.id } : null
  } catch {
    return null
  }
}
