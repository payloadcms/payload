import type { AdminViewServerProps, PayloadComponent, SanitizedConfig } from 'payload'

import type { ViewFromConfig } from './getRouteData.js'

export const getCustomViewByKey = ({
  config,
  viewKey,
}: {
  config: SanitizedConfig
  viewKey: string
}): null | {
  view: ViewFromConfig
  viewKey: string
} => {
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
