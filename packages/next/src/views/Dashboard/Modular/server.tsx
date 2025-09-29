import type { WidgetInstance } from 'payload'
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

  const createClientLayout = (layout: WidgetInstance[]): WidgetInstanceClient[] => {
    return layout.map((widgetInstance, index) => {
      const colsPerRow = 11
      let x = 0

      // Simple layout algorithm: place widgets left to right, then wrap to next row
      let currentX = 0
      for (let i = 0; i < index; i++) {
        const prevWidgetInstance = layout[i]
        currentX += prevWidgetInstance.width || 3
        // If we exceed the row width, wrap to next row
        if (currentX > colsPerRow) {
          currentX = 0
        }
      }
      x = currentX

      return {
        clientLayout: {
          h: widgetInstance.height || 1,
          i: `${widgetInstance.widgetSlug}-${index}`,
          maxH: 3,
          maxW: 12,
          minH: 1,
          minW: 3,
          w: widgetInstance.width || 3,
          x,
          y: 0,
        },
        component: RenderServerComponent({
          Component: widgets.find((w) => w.slug === widgetInstance.widgetSlug)?.ComponentPath,
          importMap,
          serverProps: {
            ...props,
            widgetSlug: widgetInstance.widgetSlug,
          },
        }),
      }
    })
  }

  // Helper function to get saved layout
  const getSavedLayout = async (): Promise<null | WidgetInstance[]> => {
    if (!user) {
      return null
    }

    try {
      const savedPreferences = await getPreferences(
        'dashboard-layout',
        props.payload,
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

      const layouts = (savedPreferences.value as { layouts: Layout[] }).layouts

      return layouts.map((layoutItem) => {
        // Extract widget slug and index from layout item id
        const parts = layoutItem.i.split('-')
        const index = parseInt(parts[parts.length - 1])
        const widgetSlug = parts.slice(0, -1).join('-')
        const originalWidget = defaultLayout[index]

        return {
          height: Math.min(Math.max(layoutItem.h, 1), 3) as 1 | 2 | 3,
          widgetSlug: originalWidget?.widgetSlug || widgetSlug,
          width: Math.min(Math.max(layoutItem.w, 3), 12),
        } as WidgetInstance
      })
    } catch {
      return null
    }
  }

  // Determine final layout (saved or default)
  const savedLayout = await getSavedLayout()
  const finalLayout = createClientLayout(savedLayout || defaultLayout)

  return (
    <div>
      <ModularDashboardClient layout={finalLayout} widgets={widgets} />
    </div>
  )
}
