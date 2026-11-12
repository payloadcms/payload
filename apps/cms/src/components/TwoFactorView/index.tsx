import type { AdminViewServerProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/ui/rsc'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

import type { User } from '../../payload-types'

import { isTwoFactorCookieValid, TWO_FACTOR_COOKIE } from '../../twoFactor/cookie'
import { TwoFactorForm } from '../TwoFactorForm'

/**
 * `/admin/2fa`: set up two-factor authentication (first login), enter the code (every login), or
 * reset it (e.g. for a new phone). src/proxy.ts sends unverified sessions here.
 */
export async function TwoFactorView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  const { admin: adminRoute, api: apiRoute } = req.payload.config.routes

  if (!req.user) {
    redirect(`${adminRoute}/login?redirect=${encodeURIComponent(`${adminRoute}/2fa`)}`)
  }

  const stored = await req.payload.db.findOne<Pick<User, 'id' | 'twoFactorEnabled'>>({
    collection: 'users',
    req,
    where: { id: { equals: req.user.id } },
  })

  const cookieStore = await cookies()
  const isVerified = isTwoFactorCookieValid({
    session: { sid: req.user._sid, userID: req.user.id },
    value: cookieStore.get(TWO_FACTOR_COOKIE)?.value,
  })

  // Only follow redirects within the admin panel
  const requested = typeof searchParams?.redirect === 'string' ? searchParams.redirect : ''
  const redirectTo =
    requested.startsWith(`${adminRoute}`) && !requested.startsWith('//') ? requested : adminRoute

  return (
    <MinimalTemplate>
      <TwoFactorForm
        adminRoute={adminRoute}
        apiRoute={apiRoute}
        email={String(req.user.email ?? '')}
        mode={!stored?.twoFactorEnabled ? 'setup' : isVerified ? 'manage' : 'verify'}
        redirectTo={redirectTo}
      />
    </MinimalTemplate>
  )
}
