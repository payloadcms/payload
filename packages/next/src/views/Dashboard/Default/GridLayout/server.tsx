import type {
  BasePayload,
  DashboardConfig,
  PayloadRequest,
  TypedUser,
  Widget,
  WidgetInstance,
  WidgetServerProps,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { DashboardViewServerProps } from '../index.js'
import type { WidgetInstanceClient, WidgetItem } from './client.js'

import { getPreferences } from '../../../../utilities/getPreferences.js'
import { GridLayoutDashboardClient } from './client.js'
import './index.scss'

type ServerLayout = WidgetInstanceClient[]

export async function GridLayoutDashboard(props: DashboardViewServerProps) {
  const { defaultLayout = [], widgets } = props.payload.config.admin.dashboard || {}
  const { importMap } = props.payload
  const { user } = props
  const { req } = props.initPageResult

  const layout =
    (await getItemsFromPreferences(props.payload, user)) ??
    (await getItemsFromConfig(defaultLayout, req, widgets))

  const serverLayout: ServerLayout = layout.map((layoutItem) => {
    const widgetSlug = layoutItem.i.slice(0, layoutItem.i.lastIndexOf('-'))
    return {
      component: RenderServerComponent({
        Component: widgets.find((w) => w.slug === widgetSlug)?.ComponentPath,
        importMap,
        serverProps: {
          req,
          widgetSlug,
          // widgetData: layoutItem.data,
        } satisfies WidgetServerProps,
      }),
      item: layoutItem,
    }
  })

  return (
    <div>
      <GridLayoutDashboardClient clientLayout={serverLayout} widgets={widgets} />
    </div>
  )
}

async function getItemsFromPreferences(
  payload: BasePayload,
  user: TypedUser,
): Promise<WidgetItem[]> {
  const savedPreferences = await getPreferences(
    'dashboard-layout',
    payload,
    user.id,
    user.collection,
  )
  if (
    !savedPreferences?.value ||
    typeof savedPreferences.value !== 'object' ||
    !('layouts' in savedPreferences.value)
  ) {
    return null
  }
  return savedPreferences.value.layouts as null | WidgetItem[]
}

async function getItemsFromConfig(
  defaultLayout: NonNullable<DashboardConfig['defaultLayout']>,
  req: PayloadRequest,
  widgets: Widget[],
): Promise<WidgetItem[]> {
  // Handle function format
  let widgetInstances: WidgetInstance[]
  if (typeof defaultLayout === 'function') {
    widgetInstances = await defaultLayout({ req })
  } else {
    widgetInstances = defaultLayout
  }

  return widgetInstances.map((widgetInstance, index) => {
    const widget = widgets.find((w) => w.slug === widgetInstance.widgetSlug)
    return {
      i: `${widgetInstance.widgetSlug}-${index}`,
      maxW: widget?.maxWidth ?? 'full',
      minW: widget?.minWidth ?? 'x-small',
      w: widgetInstance.width || 'x-small',
    }
  })
}
