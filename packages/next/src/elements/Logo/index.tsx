import type { ServerProps } from 'payload'
import type React from 'react'

import { Logo as LogoUI } from '@payloadcms/ui/elements/Logo'
import { PayloadLogo } from '@payloadcms/ui/shared'

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

  const customLogo = CustomLogo
    ? RenderServerComponent({
        Component: CustomLogo,
        Fallback: PayloadLogo,
        importMap: payload.importMap,
        serverProps: {
          i18n,
          locale,
          params,
          payload,
          permissions,
          renderComponent: RenderServerComponent,
          searchParams,
          user,
        },
      })
    : undefined

  return <LogoUI customLogo={customLogo} />
}
