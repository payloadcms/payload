import type { TFunction } from '@payloadcms/translations'
import type { ClientWidget, Field, WidgetServerProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { DashboardViewServerProps } from '../index.js'
import type { WidgetInstanceClient } from './index.client.js'

import { ModularDashboardClient } from './index.client.js'
import { getItemsFromConfig } from './utils/getItemsFromConfig.js'
import { getItemsFromPreferences } from './utils/getItemsFromPreferences.js'
import { extractLocaleData } from './utils/localeUtils.js'
import './index.scss'

type ServerLayout = WidgetInstanceClient[]

export async function ModularDashboard(props: DashboardViewServerProps) {
  const { defaultLayout = [], widgets = [] } = props.payload.config.admin.dashboard || {}
  const { user } = props
  const { cookies, locale, permissions, req } = props.initPageResult
  const { i18n } = req

  const layout =
    (await getItemsFromPreferences(props.payload, user)) ??
    (await getItemsFromConfig(defaultLayout, req, widgets))

  const serverLayout: ServerLayout = layout.map((layoutItem) => {
    const widgetSlug = layoutItem.id.slice(0, layoutItem.id.lastIndexOf('-'))
    const widgetConfig = widgets.find((widget) => widget.slug === widgetSlug)
    const widgetData = widgetConfig?.fields?.length
      ? extractLocaleData(layoutItem.data || {}, req.locale || 'en', widgetConfig.fields as Field[])
      : layoutItem.data || {}

    return {
      component: RenderServerComponent({
        Component: widgetConfig?.ComponentPath,
        serverProps: {
          cookies,
          locale,
          permissions,
          req,
          widgetData,
          widgetSlug,
        } satisfies WidgetServerProps,
      }),
      item: layoutItem,
    }
  })

  // Resolve function labels to static labels for client components
  const clientWidgets: ClientWidget[] = widgets.map((widget) => {
    const { ComponentPath: _, fields: __, label, ...rest } = widget
    return {
      ...rest,
      label: typeof label === 'function' ? label({ i18n, t: i18n.t as TFunction }) : label,
    }
  })

  return (
    <div>
      <ModularDashboardClient clientLayout={serverLayout} widgets={clientWidgets} />
    </div>
  )
}
