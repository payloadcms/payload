import type {
  BasePayload,
  DashboardConfig,
  DashboardViewServerProps,
  PayloadRequest,
  TypedUser,
  Widget,
  WidgetInstance,
  WidgetServerProps,
} from 'payload'
import type { Layout } from 'react-grid-layout'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { WidgetInstanceClient } from './client.js'

import { getPreferences } from '../../../../utilities/getPreferences.js'
import { GridLayoutDashboardClient } from './client.js'
import './index.scss'

export async function GridLayoutDashboard(props: DashboardViewServerProps) {
  const { defaultLayout = [], widgets } = props.payload.config.admin.dashboard || {}
  const { importMap } = props.payload
  const { user } = props
  const { req } = props.initPageResult

  const layout =
    (await getLayoutFromPreferences(props.payload, user)) ??
    (await getLayoutFromConfig(defaultLayout, req, widgets))

  const clientLayout: WidgetInstanceClient[] = layout.map((layoutItem) => {
    const widgetSlug = layoutItem.i.slice(0, layoutItem.i.lastIndexOf('-'))
    return {
      clientLayout: layoutItem,
      component: RenderServerComponent({
        Component: widgets.find((w) => w.slug === widgetSlug)?.ComponentPath,
        importMap,
        serverProps: {
          req,
          widgetSlug,
          // widgetData: layoutItem.data,
        } satisfies WidgetServerProps,
      }),
    }
  })

  return (
    <div>
      <GridLayoutDashboardClient clientLayout={clientLayout} widgets={widgets} />
    </div>
  )
}

async function getLayoutFromPreferences(payload: BasePayload, user: TypedUser) {
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
  return savedPreferences.value.layouts as Layout[] | null
}

async function getLayoutFromConfig(
  defaultLayout: NonNullable<DashboardConfig['defaultLayout']>,
  req: PayloadRequest,
  widgets: Widget[],
): Promise<Layout[]> {
  // Handle function format
  let widgetInstances: WidgetInstance[]
  if (typeof defaultLayout === 'function') {
    widgetInstances = await defaultLayout({ req })
  } else {
    widgetInstances = defaultLayout
  }

  return widgetInstances.map((widgetInstance, index) => {
    const colsPerRow = 12
    let x = 0

    // Simple layout algorithm: place widgets left to right, then wrap to next row
    let currentX = 0
    for (let i = 0; i < index; i++) {
      const prevWidgetInstance = widgetInstances[i]
      currentX += prevWidgetInstance.width || 3
      // If we exceed the row width, wrap to next row
      if (currentX + (widgetInstance.width || 3) > colsPerRow) {
        currentX = 0
      }
    }
    x = currentX

    const widget = widgets.find((w) => w.slug === widgetInstance.widgetSlug)

    return {
      h: widgetInstance.height || 1,
      i: `${widgetInstance.widgetSlug}-${index}`,
      maxH: widget?.maxHeight ?? 3,
      maxW: widget?.maxWidth ?? 12,
      minH: widget?.minHeight ?? 1,
      minW: widget?.minWidth ?? 3,
      resizeHandles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
      w: widgetInstance.width || 3,
      x,
      y: 0,
    }
  })
}
