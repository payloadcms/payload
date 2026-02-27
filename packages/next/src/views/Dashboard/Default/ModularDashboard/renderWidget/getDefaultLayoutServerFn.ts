import type {
  DashboardConfig,
  PayloadRequest,
  ServerFunction,
  Widget,
  WidgetServerProps,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

import type { WidgetInstanceClient, WidgetItem } from '../index.client.js'

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
> = async ({ cookies, locale, permissions, req }) => {
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
          widgetData: layoutItem.data || {},
          widgetSlug,
        } satisfies WidgetServerProps,
      }),
      item: layoutItem,
    }
  })

  return { layout }
}

async function getItemsFromConfig(
  defaultLayout: NonNullable<DashboardConfig['defaultLayout']>,
  req: PayloadRequest,
  widgets: Pick<Widget, 'maxWidth' | 'minWidth' | 'slug'>[],
): Promise<WidgetItem[]> {
  let widgetInstances
  if (typeof defaultLayout === 'function') {
    widgetInstances = await defaultLayout({ req })
  } else {
    widgetInstances = defaultLayout
  }

  return widgetInstances.map((widgetInstance, index) => {
    const widget = widgets.find((w) => w.slug === widgetInstance.widgetSlug)
    return {
      id: `${widgetInstance.widgetSlug}-${index}`,
      data: widgetInstance.data,
      maxWidth: widget?.maxWidth ?? 'full',
      minWidth: widget?.minWidth ?? 'x-small',
      width: widgetInstance.width || 'x-small',
    }
  })
}
