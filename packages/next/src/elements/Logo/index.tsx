import type { ServerProps } from 'payload'
import type React from 'react'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { PayloadLogo } from '@payloadcms/ui/shared'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'

export const Logo: React.FC<ServerProps> = (props) => {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props

  const adminConfig = getAdminConfig()
  const CustomLogo = adminConfig.admin?.graphics?.Logo

  return RenderServerComponent({
    Component: CustomLogo as React.ComponentType,
    Fallback: PayloadLogo,
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
}
