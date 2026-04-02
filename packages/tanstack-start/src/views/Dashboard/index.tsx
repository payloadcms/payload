'use client'

import type { ClientWidget } from 'payload'

import { ModularDashboardClient, RenderWidget, type WidgetInstanceClient } from '@payloadcms/ui'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function DashboardView({ pageState }: { pageState: SerializablePageState }) {
  const layoutItems = pageState.pageData?.dashboard?.layoutItems ?? []
  const widgets: ClientWidget[] = pageState.clientConfig?.admin?.dashboard?.widgets ?? []

  const clientLayout: WidgetInstanceClient[] = React.useMemo(
    () =>
      layoutItems.map((item) => ({
        component: React.createElement(RenderWidget, {
          widgetData: item.data,
          widgetId: item.id,
        }),
        item: {
          id: item.id,
          data: item.data,
          maxWidth: item.maxWidth as WidgetInstanceClient['item']['maxWidth'],
          minWidth: item.minWidth as WidgetInstanceClient['item']['minWidth'],
          width: item.width as WidgetInstanceClient['item']['width'],
        },
      })),
    [layoutItems],
  )

  return (
    <div>
      <ModularDashboardClient clientLayout={clientLayout} widgets={widgets} />
    </div>
  )
}
