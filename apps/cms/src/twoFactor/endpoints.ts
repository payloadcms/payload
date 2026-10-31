import type { Endpoint, PayloadRequest } from 'payload'

import crypto from 'node:crypto'
import QRCode from 'qrcode'

import { createTwoFactorCookieValue, MAX_AGE_SECONDS, twoFactorCookieHeader } from './cookie'
import { generateSecret, otpauthURL, verifyCode } from './totp'

/**
 * Two-factor endpoints on the users collection (`/api/users/2fa/...`). src/proxy.ts lets a logged-in
 * but not yet verified session reach these, so each one checks a code before granting anything.
 */

const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
const BACKUP_CODE_COUNT = 10

type TwoFactorState = {
  email?: string
  id: number | string
  twoFactorBackupCodes?: null | string[]
  twoFactorEnabled?: boolean | null
  twoFactorFailedAttempts?: null | number
  twoFactorLastStep?: null | number
  twoFactorLockUntil?: null | string
  twoFactorPendingSecret?: null | string
  twoFactorSecret?: null | string
}

export const twoFactorEndpoints: Endpoint[] = [
  {
    // Starts enrollment: returns a new secret and its QR code; activated by /2fa/enable
    handler: async (req) => {
      const user = await loadUser({ req })
      if (!user) {
        return error({ message: 'You must be logged in.', status: 401 })
      }
      if (user.twoFactorEnabled) {
        return error({ message: 'Two-factor authentication is already set up.', status: 409 })
      }

      const secret = generateSecret()
      const url = otpauthURL({ account: user.email || String(user.id), issuer: issuer(), secret })

      await saveUser({ data: { twoFactorPendingSecret: req.payload.encrypt(secret) }, req })

      return Response.json({
        qrCode: await QRCode.toString(url, { margin: 1, type: 'svg' }),
        secret,
        url,
      })
    },
    method: 'post',
    path: '/2fa/setup',
  },
  {
    // Finishes enrollment with a code from the new secret; returns the backup codes once
    handler: async (req) => {
      const user = await loadUser({ req })
      if (!user) {
        return error({ message: 'You must be logged in.', status: 401 })
      }
      if (user.twoFactorEnabled || !user.twoFactorPendingSecret) {
        return error({ message: 'Start the setup first.', status: 409 })
      }

      const result = await checkCode({
        allowBackupCodes: false,
        code: await readCode({ req }),
        req,
        secret: req.payload.decrypt(user.twoFactorPendingSecret),
        user,
      })
      if (result instanceof Response) {
        return result
      }

      const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () => {
        const code = crypto.randomBytes(5).toString('hex')
        return `${code.slice(0, 5)}-${code.slice(5)}`
      })

      await saveUser({
        data: {
          ...result,
          twoFactorBackupCodes: backupCodes.map((code) => hashBackupCode({ code })),
          twoFactorEnabled: true,
          twoFactorPendingSecret: null,
          twoFactorSecret: user.twoFactorPendingSecret,
        },
        req,
      })

      return verifiedResponse({ body: { backupCodes }, req })
    },
    method: 'post',
    path: '/2fa/enable',
  },
  {
    // Checks the code (or a backup code) at login
    handler: async (req) => {
      const user = await loadUser({ req })
      if (!user) {
        return error({ message: 'You must be logged in.', status: 401 })
      }
      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return error({ message: 'Set up two-factor authentication first.', status: 409 })
      }

      const result = await checkCode({
        allowBackupCodes: true,
        code: await readCode({ req }),
        req,
        secret: req.payload.decrypt(user.twoFactorSecret),
        user,
      })
      if (result instanceof Response) {
        return result
      }

      await saveUser({ data: result, req })

      return verifiedResponse({
        body: {
          backupCodesLeft: (result.twoFactorBackupCodes ?? user.twoFactorBackupCodes)?.length,
        },
        req,
      })
    },
    method: 'post',
    path: '/2fa/verify',
  },
  {
    // Turns two-factor off after a valid code, e.g. to move to a new phone. It is set up again at
    // the next request, because every account needs it.
    handler: async (req) => {
      const user = await loadUser({ req })
      if (!user) {
        return error({ message: 'You must be logged in.', status: 401 })
      }
      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return error({ message: 'Two-factor authentication is not set up.', status: 409 })
      }

      const result = await checkCode({
        allowBackupCodes: true,
        code: await readCode({ req }),
        req,
        secret: req.payload.decrypt(user.twoFactorSecret),
        user,
      })
      if (result instanceof Response) {
        return result
      }

      await saveUser({
        data: {
          twoFactorBackupCodes: null,
          twoFactorEnabled: false,
          twoFactorFailedAttempts: 0,
          twoFactorLastStep: null,
          twoFactorLockUntil: null,
          twoFactorPendingSecret: null,
          twoFactorSecret: null,
        },
        req,
      })

      return Response.json(
        { ok: true },
        { headers: { 'Set-Cookie': twoFactorCookieHeader({ maxAge: 0, value: '' }) } },
      )
    },
    method: 'post',
    path: '/2fa/reset',
  },
]

const error = ({ message, status }: { message: string; status: number }) =>
  Response.json({ errors: [{ message }] }, { status })

const issuer = () => {
  try {
    return new URL(process.env.SERVER_URL || '').hostname || 'Payload CMS'
  } catch {
    return 'Payload CMS'
  }
}

const loadUser = async ({ req }: { req: PayloadRequest }) => {
  if (!req.user || req.user.collection !== 'users') {
    return null
  }

  // The adapter returns the stored document, including the fields the API never exposes
  return req.payload.db.findOne<TwoFactorState>({
    collection: 'users',
    req,
    where: { id: { equals: req.user.id } },
  })
}

const saveUser = async ({
  data,
  req,
}: {
  data: Partial<Omit<TwoFactorState, 'id'>>
  req: PayloadRequest
}) => {
  await req.payload.db.updateOne({
    collection: 'users',
    data,
    id: req.user!.id,
    req,
    returning: false,
  })
}

const readCode = async ({ req }: { req: PayloadRequest }): Promise<string> => {
  const body = (await req.json?.().catch(() => null)) as { code?: unknown } | null
  return typeof body?.code === 'string' ? body.code.trim() : ''
}

const hashBackupCode = ({ code }: { code: string }) =>
  crypto
    .createHash('sha256')
    .update(code.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .digest('hex')

/**
 * Accepts an authenticator code (each one only once) or, if allowed, an unused backup code. Returns
 * the user fields to store, or an error response. Too many wrong codes lock two-factor for a while.
 */
const checkCode = async ({
  allowBackupCodes,
  code,
  req,
  secret,
  user,
}: {
  allowBackupCodes: boolean
  code: string
  req: PayloadRequest
  secret: string
  user: TwoFactorState
}): Promise<Partial<TwoFactorState> | Response> => {
  if (user.twoFactorLockUntil && new Date(user.twoFactorLockUntil) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(user.twoFactorLockUntil).getTime() - Date.now()) / 60_000,
    )

    return error({
      message: `Too many wrong codes. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      status: 429,
    })
  }

  const success = { twoFactorFailedAttempts: 0, twoFactorLockUntil: null }

  const step = verifyCode({ code, secret })
  if (step !== null && step > (user.twoFactorLastStep ?? -1)) {
    return { ...success, twoFactorLastStep: step }
  }

  const backupCodes = user.twoFactorBackupCodes ?? []
  const backupCodeIndex = allowBackupCodes ? backupCodes.indexOf(hashBackupCode({ code })) : -1
  if (code && backupCodeIndex !== -1) {
    return {
      ...success,
      twoFactorBackupCodes: backupCodes.filter((_, index) => index !== backupCodeIndex),
    }
  }

  const failedAttempts = (user.twoFactorFailedAttempts ?? 0) + 1
  const isLocked = failedAttempts >= MAX_FAILED_ATTEMPTS

  await saveUser({
    data: {
      twoFactorFailedAttempts: isLocked ? 0 : failedAttempts,
      twoFactorLockUntil: isLocked
        ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
        : null,
    },
    req,
  })

  return error({
    message: isLocked
      ? `Too many wrong codes. Two-factor is locked for ${LOCK_MINUTES} minutes.`
      : 'That code is not valid.',
    status: isLocked ? 429 : 400,
  })
}

/** Marks this login session as verified */
const verifiedResponse = ({ body, req }: { body: object; req: PayloadRequest }) =>
  Response.json(body, {
    headers: {
      'Set-Cookie': twoFactorCookieHeader({
        maxAge: MAX_AGE_SECONDS,
        value: createTwoFactorCookieValue({
          session: { sid: req.user?._sid, userID: req.user!.id },
        }),
      }),
    },
  })
