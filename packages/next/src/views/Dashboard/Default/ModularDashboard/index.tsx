import type { DashboardViewServerProps } from '@payloadcms/ui/views/Dashboard/Default'
import type { WidgetServerProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { ModularDashboard as ModularDashboardUI } from '@payloadcms/ui/views/Dashboard/Default/ModularDashboard'
import { getModularDashboardData } from '@payloadcms/ui/views/Dashboard/Default/ModularDashboard/getModularDashboardData'
import React from 'react'

export async function ModularDashboard(props: DashboardViewServerProps) {
  const { importMap } = props.payload
  const { user } = props
  const { cookies, locale, permissions, req } = props.initPageResult

  const { clientWidgets, layoutItems } = await getModularDashboardData({ req, user })

  const clientLayout = layoutItems.map((item) => ({
    component: RenderServerComponent({
      Component: item.widgetComponent,
      importMap,
      serverProps: {
        cookies,
        locale,
        permissions,
        req,
        widgetData: item.widgetData,
        widgetSlug: item.widgetSlug,
      } satisfies WidgetServerProps,
    }),
    item: {
      id: item.id,
      data: item.data,
      maxWidth: item.maxWidth,
      minWidth: item.minWidth,
      width: item.width,
    },
  }))

  return <ModularDashboardUI clientLayout={clientLayout} clientWidgets={clientWidgets} />
}
