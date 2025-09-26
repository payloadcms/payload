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
  const {
    payload,
    payload: {
      config: {
        admin: { dashboard: dashboardConfig },
      },
      importMap,
    },
    user,
  } = props
  const { widgets } = dashboardConfig

  if (!dashboardConfig?.defaultLayout || !dashboardConfig?.widgets) {
    return <div>No dashboard configuration found</div>
  }

  // Generate layout for widgets
  const generateLayout = (layout: WidgetInstance[]): WidgetInstanceClient[] => {
    return layout.map((widgetInstance, index) => {
      const colsPerRow = 12
      let x = 0

      // Simple layout algorithm: place widgets left to right, then wrap to next row
      let currentX = 0
      for (let i = 0; i < index; i++) {
        const prevWidgetInstance = layout[i]
        currentX += prevWidgetInstance.width || 3
        // If we exceed the row width, wrap to next row
        if (currentX > colsPerRow) {
          currentX = prevWidgetInstance.width || 3
        }
      }
      x = currentX

      return {
        component: RenderServerComponent({
          Component: widgets.find((w) => w.slug === widgetInstance.widgetSlug)?.ComponentPath,
          importMap,
          serverProps: {
            ...props,
            dashboardConfig,
            widgetSlug: widgetInstance.widgetSlug,
          },
        }),
        layout: {
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
      }
    })
  }

  // Determine final layout (saved or default)
  let finalLayout: WidgetInstanceClient[]

  if (user) {
    try {
      const savedPreferences = await getPreferences(
        'dashboard-layout',
        payload,
        user.id,
        user.collection,
      )

      if (
        savedPreferences?.value &&
        typeof savedPreferences.value === 'object' &&
        'layouts' in savedPreferences.value
      ) {
        // User has saved preferences, use them
        const savedLayoutData = (savedPreferences.value as { layouts: Layout[] }).layouts

        // Reconstruct widget instances from saved layout
        const savedWidgetInstances: WidgetInstance[] = savedLayoutData.map((layoutItem) => {
          // Extract widget slug and index from layout item id
          const parts = layoutItem.i.split('-')
          const index = parseInt(parts[parts.length - 1])
          const widgetSlug = parts.slice(0, -1).join('-')

          // Find the original widget instance
          const originalWidget = dashboardConfig.defaultLayout[index]

          return {
            height: Math.min(Math.max(layoutItem.h, 1), 3),
            widgetSlug: originalWidget?.widgetSlug || widgetSlug,
            width: Math.min(Math.max(layoutItem.w, 3), 12),
          } as WidgetInstance
        })

        finalLayout = generateLayout(savedWidgetInstances)
      } else {
        // No saved preferences, use default
        finalLayout = generateLayout(dashboardConfig.defaultLayout)
      }
    } catch {
      // Error loading preferences, fallback to default
      finalLayout = generateLayout(dashboardConfig.defaultLayout)
    }
  } else {
    // No user, use default
    finalLayout = generateLayout(dashboardConfig.defaultLayout)
  }

  return (
    <div>
      <ModularDashboardClient layout={finalLayout} widgets={dashboardConfig.widgets} />
    </div>
  )
}
