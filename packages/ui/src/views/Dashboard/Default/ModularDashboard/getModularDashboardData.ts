import type { TFunction } from '@payloadcms/translations'
import type {
  ClientWidget,
  PayloadComponent,
  PayloadRequest,
  TypedUser,
  WidgetWidth,
} from 'payload'

import { getItemsFromConfig } from './utils/getItemsFromConfig.js'
import { getItemsFromPreferences } from './utils/getItemsFromPreferences.js'
import { extractLocaleData } from './utils/localeUtils.js'

export type LayoutItem = {
  data: Record<string, unknown>
  id: string
  maxWidth: WidgetWidth
  minWidth: WidgetWidth
  widgetComponent: PayloadComponent | undefined
  widgetData: Record<string, unknown>
  widgetSlug: string
  width: WidgetWidth
}

export type ModularDashboardData = {
  clientWidgets: ClientWidget[]
  layoutItems: LayoutItem[]
}

export async function getModularDashboardData({
  req,
  user,
}: {
  req: PayloadRequest
  user: TypedUser
}): Promise<ModularDashboardData> {
  const { i18n, payload } = req
  const { defaultLayout = [], widgets = [] } = payload.config.admin.dashboard || {}

  const layout =
    (await getItemsFromPreferences(payload, user)) ??
    (await getItemsFromConfig(defaultLayout, req, widgets))

  const layoutItems: LayoutItem[] = layout.map((layoutItem) => {
    const widgetSlug = layoutItem.id.slice(0, layoutItem.id.lastIndexOf('-'))
    const widgetConfig = widgets.find((widget) => widget.slug === widgetSlug)
    const widgetData = widgetConfig?.fields?.length
      ? extractLocaleData(layoutItem.data || {}, req.locale || 'en', widgetConfig.fields)
      : layoutItem.data || {}

    return {
      id: layoutItem.id,
      data: layoutItem.data || {},
      maxWidth: layoutItem.maxWidth,
      minWidth: layoutItem.minWidth,
      widgetComponent: widgetConfig?.Component,
      widgetData,
      widgetSlug,
      width: layoutItem.width,
    }
  })

  const clientWidgets: ClientWidget[] = widgets.map((widget) => {
    const { Component: _, fields: __, label, ...rest } = widget
    return {
      ...rest,
      label: typeof label === 'function' ? label({ i18n, t: i18n.t as TFunction }) : label,
    }
  })

  return {
    clientWidgets,
    layoutItems,
  }
}
