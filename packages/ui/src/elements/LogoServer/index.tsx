import type { ServerProps } from 'payload'
import type React from 'react'

import { PayloadLogo } from '../../graphics/Logo/index.js'
import { Logo as LogoUI } from '../Logo/index.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'

/**
 * RSC wrapper that resolves the config's custom logo (if any) via
 * `RenderServerComponent` and renders the presentational `Logo` element.
 *
 * Framework-agnostic — depends only on `payload`'s `ServerProps`. Both the
 * Next.js and TanStack Start adapters re-export this directly.
 */
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
