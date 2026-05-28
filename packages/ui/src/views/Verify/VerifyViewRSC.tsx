import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Logo } from '../../elements/LogoServer/index.js'
import { getVerifyData } from './getVerifyData.js'
import { Verify as VerifyUI } from './index.js'

export { verifyBaseClass } from './index.js'

/**
 * Framework-agnostic Verify view RSC.
 *
 * Resolves the verification token via `getVerifyData` and renders the
 * `Verify` UI element with a freshly-resolved `Logo`.
 */
export const VerifyViewRSC = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
  const [collectionSlug, , token] = params.segments
  const { locale, permissions, req } = initPageResult

  const {
    i18n,
    payload,
    payload: {
      config: {
        routes: { admin: adminRoute },
      },
    },
    user,
  } = req

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
