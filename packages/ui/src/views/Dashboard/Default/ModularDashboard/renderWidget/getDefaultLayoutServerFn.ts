import type { ServerFunction, WidgetServerProps } from 'payload'

import type { WidgetInstanceClient } from '../index.client.js'

import { RenderServerComponent } from '../../../../../elements/RenderServerComponent/index.js'
import { getItemsFromConfig } from '../utils/getItemsFromConfig.js'

export type GetDefaultLayoutServerFnArgs = Record<string, never>

export type GetDefaultLayoutServerFnReturnType = {
  layout: WidgetInstanceClient[]
}

/**
 * Server function to get the default dashboard layout on-demand.
 * Used when resetting the dashboard to its default configuration.
 */
export const getDefaultLayoutHandler: ServerFunction<
  GetDefaultLayoutServerFnArgs,
  Promise<GetDefaultLayoutServerFnReturnType>
> = async ({ cookies, locale, permissions, req, user }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { defaultLayout = [], widgets = [] } = req.payload.config.admin.dashboard || {}
  const { importMap } = req.payload

  const layoutItems = await getItemsFromConfig(defaultLayout, req, widgets)

  const layout: WidgetInstanceClient[] = layoutItems.map((layoutItem) => {
    const widgetSlug = layoutItem.id.slice(0, layoutItem.id.lastIndexOf('-'))
    return {
      component: RenderServerComponent({
        Component: widgets.find((widget) => widget.slug === widgetSlug)?.Component,
        importMap,
        serverProps: {
          cookies,
          locale,
          permissions,
          req,
          user,
          widgetData: layoutItem.data || {},
          widgetId: layoutItem.id,
          widgetSlug,
        } satisfies WidgetServerProps,
      }),
      item: layoutItem,
    }
  })

  return { layout }
}
