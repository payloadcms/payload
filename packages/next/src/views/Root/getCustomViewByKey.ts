import type { AdminViewServerProps, PayloadComponent, SanitizedConfig } from 'payload'
import type React from 'react'

import type { ViewFromConfig } from './getRouteData.js'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'

export const getCustomViewByKey = ({
  config,
  viewKey,
}: {
  config: SanitizedConfig
  viewKey: string
}): {
  view: ViewFromConfig
  viewKey: string
} | null => {
  const adminConfig = getAdminConfig()
  const adminViewComponent = adminConfig.admin?.views?.[viewKey]?.Component

  if (adminViewComponent) {
    return {
      view: {
        Component: adminViewComponent as React.FC<AdminViewServerProps>,
      },
      viewKey,
    }
  }

  const customViewComponent = config.admin.components?.views?.[viewKey]

  if (!customViewComponent) {
    return null
  }

  return {
    view: {
      payloadComponent: customViewComponent.Component as PayloadComponent<AdminViewServerProps>,
    },
    viewKey,
  }
}
