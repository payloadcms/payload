import type { AdminViewServerProps } from 'payload'

import { VerifyView as VerifyViewBase } from '@payloadcms/ui/views/Verify'
import React from 'react'

import { Logo } from '../../elements/Logo/index.js'

export { verifyBaseClass } from '@payloadcms/ui/views/Verify'

export function Verify(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const { locale, permissions, req } = initPageResult
  const { i18n, payload, user } = req

  return (
    <VerifyViewBase
      {...props}
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
    />
  )
}
