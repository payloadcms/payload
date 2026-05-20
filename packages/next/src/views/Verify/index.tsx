import type { AdminViewServerProps } from 'payload'

import { Verify as VerifyUI } from '@payloadcms/ui/views/Verify'
import { getVerifyData } from '@payloadcms/ui/views/Verify/getVerifyData'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Logo } from '../../elements/Logo/index.js'

export { verifyBaseClass } from '@payloadcms/ui/views/Verify'

export async function Verify({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const [collectionSlug, , token] = params.segments
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

  const { isVerified, textToRender } = await getVerifyData({
    collectionSlug,
    req,
    token,
  })

  return (
    <VerifyUI
      adminRoute={formatAdminURL({ adminRoute, path: '' })}
      isVerified={isVerified}
      logo={
        <Logo
          i18n={i18n}
          locale={locale}
          params={params}
          payload={payload}
          permissions={permissions}
          searchParams={searchParams}
          user={user}
        />
      }
      textToRender={textToRender}
      verifiedMessage={req.t('authentication:emailVerified')}
    />
  )
}
