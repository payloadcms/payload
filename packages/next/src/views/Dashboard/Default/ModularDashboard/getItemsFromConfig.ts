import type { DashboardConfig, PayloadRequest, Widget, WidgetInstance } from 'payload'

import type { WidgetItem } from './index.client.js'

export async function getItemsFromConfig(
  defaultLayout: NonNullable<DashboardConfig['defaultLayout']>,
  req: PayloadRequest,
  widgets: Pick<Widget, 'maxWidth' | 'minWidth' | 'slug'>[],
): Promise<WidgetItem[]> {
  let widgetInstances: WidgetInstance[]
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
