import type { ServerProps } from 'payload'

import { PayloadLogo, RenderCustomComponent } from '@payloadcms/ui/shared'
import React from 'react'

export const Logo: React.FC<ServerProps> = (props) => {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props

  const {
    admin: {
      components: {
        graphics: { Logo: CustomLogo } = {
          Logo: undefined,
        },
      } = {},
    } = {},
  } = payload.config

  return (
    <RenderCustomComponent
      CustomComponent={CustomLogo}
      DefaultComponent={PayloadLogo}
      serverOnlyProps={{
        i18n,
        locale,
        params,
        payload,
        permissions,
        searchParams,
        user,
      }}
    />
  )
}
