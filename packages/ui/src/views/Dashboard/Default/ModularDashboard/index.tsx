import type { TFunction } from '@payloadcms/translations'
import type { ClientWidget, WidgetServerProps } from 'payload'

import { createClientWidgetControls, getWidgetControlData } from 'payload/shared'
import React from 'react'

import type { DashboardViewServerProps } from '../index.js'
import type { WidgetInstanceClient } from './index.client.js'

import { RenderServerComponent } from '../../../../elements/RenderServerComponent/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { ModularDashboardClient } from '../../../../exports/client/index.js'
import { getItemsFromConfig } from './utils/getItemsFromConfig.js'
import { getItemsFromPreferences } from './utils/getItemsFromPreferences.js'
import { extractLocaleData } from './utils/localeUtils.js'
import './index.css'

type ServerLayout = WidgetInstanceClient[]

export async function ModularDashboard(props: DashboardViewServerProps) {
  const { defaultLayout = [], widgets = [] } = props.payload.config.admin.dashboard || {}
  const { importMap } = props.payload
  const { user } = props
  const { cookies, locale, permissions, req } = props.initPageResult
  const { i18n } = req

  const layout =
    (await getItemsFromPreferences(props.payload, user)) ??
    (await getItemsFromConfig(defaultLayout, req, widgets))

  const serverLayout: ServerLayout = layout.map((layoutItem) => {
    const widgetSlug = layoutItem.id.slice(0, layoutItem.id.lastIndexOf('-'))
    const widgetConfig = widgets.find((widget) => widget.slug === widgetSlug)
    const data = getWidgetControlData({ controls: widgetConfig?.controls, data: layoutItem.data })
    const controlData = Object.fromEntries(
      widgetConfig?.controls?.map(({ name }) => [name, data[name]]) ?? [],
    )
    const widgetData = widgetConfig?.fields?.length
      ? { ...controlData, ...extractLocaleData(data, req.locale || 'en', widgetConfig.fields) }
      : data

    return {
      component: RenderServerComponent({
        Component: widgetConfig?.Component,
        importMap,
        serverProps: {
          cookies,
          locale,
          permissions,
          req,
          user,
          widgetData,
          widgetId: layoutItem.id,
          widgetSlug,
        } satisfies WidgetServerProps,
      }),
      item: { ...layoutItem, data },
    }
  })

  // Resolve function labels to static labels for client components
  const clientWidgets: ClientWidget[] = widgets.map((widget) => {
    const { Component: _, controls, fields: __, label, ...rest } = widget
    return {
      ...rest,
      controls: createClientWidgetControls({ controls, i18n, importMap }),
      label: typeof label === 'function' ? label({ i18n, t: i18n.t as TFunction }) : label,
    }
  })

  return (
    <div>
      <ModularDashboardClient clientLayout={serverLayout} widgets={clientWidgets} />
    </div>
  )
}
