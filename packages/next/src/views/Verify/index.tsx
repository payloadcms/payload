import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Logo } from '../../elements/Logo/index.js'
import { ToastAndRedirect } from './index.client.js'
import './index.scss'

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

  let textToRender
  let isVerified = false

  try {
    await req.payload.verifyEmail({
      collection: collectionSlug,
      token,
    })

    isVerified = true
    textToRender = req.t('authentication:emailVerified')
  } catch (e) {
    textToRender = req.t('authentication:unableToVerify')
  }

  if (isVerified) {
    return (
      <ToastAndRedirect
        message={req.t('authentication:emailVerified')}
        redirectTo={formatAdminURL({ adminRoute, path: '/login' })}
      />
    )
  }

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
          user={user}
        />
      </div>
      <h2>{textToRender}</h2>
    </React.Fragment>
  )
}
