import type { DashboardConfig, PayloadRequest, ServerFunction, Widget } from 'payload'

import type { WidgetItem } from '../../views/Dashboard/Default/ModularDashboard/index.client.js'

export type GetDefaultLayoutDataOnlyResult = {
  layout: ({ widgetSlug: string } & WidgetItem)[]
}

/**
 * Data-only alternative to `getDefaultLayoutHandler`.
 * Returns layout config items with widget slugs instead of rendered component nodes.
 * The client resolves widget components via the import map.
 */
export const getDefaultLayoutDataOnlyHandler: ServerFunction<
  Record<string, never>,
  Promise<GetDefaultLayoutDataOnlyResult>
> = async ({ req }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { defaultLayout = [], widgets = [] } = req.payload.config.admin.dashboard || {}

  const layoutItems = await getItemsFromConfig(defaultLayout, req, widgets)

  const layout = layoutItems.map((layoutItem) => {
    const widgetSlug = layoutItem.id.slice(0, layoutItem.id.lastIndexOf('-'))
    return {
      ...layoutItem,
      widgetSlug,
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
