import type { ServerProps } from 'payload'

import { PayloadLogo, RenderComponent, getCreateMappedComponent } from '@payloadcms/ui/shared'
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

  const createMappedComponent = getCreateMappedComponent({
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const mappedCustomLogo = createMappedComponent(CustomLogo, undefined, PayloadLogo, 'CustomLogo')

  return <RenderComponent mappedComponent={mappedCustomLogo} />
}
