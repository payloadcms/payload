import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Logo } from '../../elements/Logo/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { VerifyClient } from '../../exports/client/index.js'
import './index.css'

export const verifyBaseClass = 'verify'

export async function Verify({ initPageResult, params, searchParams }: AdminViewServerProps) {
  // /:collectionSlug/verify/:token

  const [collectionSlug, verify, token] = params.segments
  const { locale, permissions, req } = initPageResult

  const {
    i18n,
    payload: { config },
    payload,
    user,
  } = req

  const {
    routes: { admin: adminRoute },
  } = config

  let isVerified = false

  try {
    await req.payload.verifyEmail({
      collection: collectionSlug,
      token,
    })

    isVerified = true
  } catch {
    // Verification failed - isVerified stays false
  }

  const loginRoute = formatAdminURL({ adminRoute, path: '/login' })

  return (
    <React.Fragment>
      <div className={`${verifyBaseClass}__brand`}>
        <Logo
          i18n={i18n}
          locale={locale}
          params={params}
          payload={payload}
          permissions={permissions}
          searchParams={searchParams}
          server={req.server}
          user={user}
        />
      </div>
      {isVerified ? (
        <VerifyClient loginRoute={loginRoute} />
      ) : (
        <h2>{req.t('authentication:verificationFailedRequestNew')}</h2>
      )}
    </React.Fragment>
  )
}
