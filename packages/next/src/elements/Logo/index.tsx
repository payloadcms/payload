import type { ServerProps } from 'payload'

import { PayloadLogo } from '@payloadcms/ui/shared'
import React from 'react'

import { RenderServerComponent } from '../RenderServerComponent/index.js'

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
    <RenderServerComponent
      Component={CustomLogo}
      Fallback={PayloadLogo}
      importMap={payload.importMap}
      serverProps={{
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
