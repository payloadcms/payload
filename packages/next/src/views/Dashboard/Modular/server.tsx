import type { BasePayload, TypedUser, WidgetInstance } from 'payload'
import type { Layout } from 'react-grid-layout'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { DashboardViewServerProps } from '../Default/index.js'
import type { WidgetInstanceClient } from './client.js'

import { getPreferences } from '../../../utilities/getPreferences.js'
import { ModularDashboardClient } from './client.js'
import './index.scss'

export async function ModularDashboard(props: DashboardViewServerProps) {
  const { defaultLayout, widgets } = props.payload.config.admin.dashboard
  const { importMap } = props.payload
  const { user } = props

  const layout =
    (await getLayoutFromPreferences(props.payload, user)) ?? getLayoutFromConfig(defaultLayout)

  const clientLayout: WidgetInstanceClient[] = layout.map((layoutItem) => {
    return {
      clientLayout: layoutItem,
      component: RenderServerComponent({
        Component: widgets.find((w) => w.slug === layoutItem.i.split('-')[0])?.ComponentPath,
        importMap,
        serverProps: {
          ...props,
          widgetSlug: layoutItem.i,
        },
      }),
    }
  })

  return (
    <div>
      <ModularDashboardClient clientLayout={clientLayout} widgets={widgets} />
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

function getLayoutFromConfig(defaultLayout: WidgetInstance[]): Layout[] {
  return defaultLayout.map((widgetInstance, index) => {
    const colsPerRow = 12
    let x = 0

    // Simple layout algorithm: place widgets left to right, then wrap to next row
    let currentX = 0
    for (let i = 0; i < index; i++) {
      const prevWidgetInstance = defaultLayout[i]
      currentX += prevWidgetInstance.width || 3
      // If we exceed the row width, wrap to next row
      if (currentX + (widgetInstance.width || 3) > colsPerRow) {
        currentX = 0
      }
    }
    x = currentX

    return {
      h: widgetInstance.height || 1,
      i: `${widgetInstance.widgetSlug}-${index}`,
      maxH: 3,
      maxW: 12,
      minH: 1,
      minW: 3,
      resizeHandles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
      w: widgetInstance.width || 3,
      x,
      y: 0,
    }
  })
}
