import crypto from 'node:crypto'

/**
 * The cookie that proves a login session passed its two-factor check. It is bound to the user and to
 * the session (`sid` in Payload's login token), signed with PAYLOAD_SECRET, and expires after
 * MAX_AGE_SECONDS. Logging out ends the session, so the cookie is useless for the next login.
 *
 * No Payload imports: src/proxy.ts uses this on every admin and API request.
 */

export const TWO_FACTOR_COOKIE = 'payload-2fa'

/** How long a verified session stays verified before the code is asked for again */
export const MAX_AGE_SECONDS = 12 * 60 * 60

const signingKey = () =>
  crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET || '')
    .update('two-factor-cookie')
    .digest()

const signature = ({ payload }: { payload: string }) =>
  crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url')

type Session = { sid?: null | string; userID: number | string }

const sessionPayload = ({ expires, session }: { expires: number; session: Session }) =>
  `${session.userID}.${session.sid || 'no-session'}.${expires}`

export const createTwoFactorCookieValue = ({ session }: { session: Session }): string => {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS
  const payload = sessionPayload({ expires, session })

  return `${payload}.${signature({ payload })}`
}

export const isTwoFactorCookieValid = ({
  session,
  value,
}: {
  session: Session
  value: null | string | undefined
}): boolean => {
  if (!value || !process.env.PAYLOAD_SECRET) {
    return false
  }

  const parts = value.split('.')
  const expires = Number(parts[parts.length - 2])

  if (!Number.isFinite(expires) || expires < Date.now() / 1000) {
    return false
  }

  const payload = sessionPayload({ expires, session })
  const expected = `${payload}.${signature({ payload })}`

  return (
    expected.length === value.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(value))
  )
}

export const twoFactorCookieHeader = ({
  maxAge,
  value,
}: {
  maxAge: number
  value: string
}): string => {
  // Matches the auth cookie: only sent over HTTPS once the site is served over HTTPS
  const secure = process.env.SERVER_URL?.startsWith('https://') ? '; Secure' : ''

  return `${TWO_FACTOR_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`
}
