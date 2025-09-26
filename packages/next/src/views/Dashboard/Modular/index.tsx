import type { Widget, WidgetInstance } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { DashboardViewServerProps } from '../Default/index.js'

import { getPreferences } from '../../../utilities/getPreferences.js'
import { ModularDashboardClient } from './client.js'
import './index.scss'

// Single layout item type (matches react-grid-layout's Layout item)
export type LayoutItem = {
  h: number
  i: string
  maxH?: number
  maxW?: number
  minH?: number
  minW?: number
  w: number
  x: number
  y: number
}

export type RenderedWidget = {
  component: React.ReactNode
  layout: LayoutItem
} & WidgetInstance

export type RenderedWidgetLibrary = {
  component: React.ReactNode
} & Widget

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

  if (!dashboardConfig?.defaultWidgets || !dashboardConfig?.widgets) {
    return <div>No dashboard configuration found</div>
  }

  // Generate layout for widgets
  const generateLayout = (widgets: WidgetInstance[]) => {
    return widgets.map((widget, index) => {
      const colsPerRow = 12
      let x = 0

      // Simple layout algorithm: place widgets left to right, then wrap to next row
      let currentX = 0

      for (let i = 0; i < index; i++) {
        const prevWidget = widgets[i]
        currentX += prevWidget.width || 3

        // If we exceed the row width, wrap to next row
        if (currentX > colsPerRow) {
          currentX = prevWidget.width || 3
        }
      }

      x = currentX

      return {
        h: widget.height || 1,
        i: `${widget.widgetSlug}-${index}`,
        maxH: 3,
        maxW: 12,
        minH: 1,
        minW: 3,
        w: widget.width || 3,
        x,
        y: 0,
      }
    })
  }

  // Render widget components
  const renderWidgets = (widgets: WidgetInstance[], layout: any[]): RenderedWidget[] => {
    return widgets.map((widget, index) => {
      const ComponentPath = dashboardConfig.widgets.find(
        (w) => w.slug === widget.widgetSlug,
      )?.ComponentPath

      if (!ComponentPath) {
        throw new Error(`Widget ${widget.widgetSlug} not found`)
      }

      const WidgetComponent = RenderServerComponent({
        Component: ComponentPath,
        importMap,
        serverProps: {
          ...props,
          dashboardConfig,
          widgetSlug: widget.widgetSlug,
        },
      })

      return {
        ...widget,
        component: WidgetComponent,
        layout: layout[index],
      }
    })
  }

  // Render widget library for "Add Widget" functionality
  const renderedWidgetLibrary: RenderedWidgetLibrary[] = dashboardConfig.widgets.map((widget) => {
    const WidgetComponent = RenderServerComponent({
      Component: widget.ComponentPath,
      importMap,
      serverProps: {
        ...props,
        dashboardConfig,
        widgetSlug: widget.slug,
      },
    })

    return {
      ...widget,
      component: WidgetComponent,
    }
  })

  // Generate default layout and widgets
  const defaultLayout = generateLayout(dashboardConfig.defaultWidgets)
  const defaultWidgets = renderWidgets(dashboardConfig.defaultWidgets, defaultLayout)

  // Get saved preferences and render saved widgets
  let savedWidgets: RenderedWidget[] = []

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
        // Extract widget instances from saved layout
        const savedLayout = (savedPreferences.value as { layouts: any[] }).layouts
        const savedWidgetInstances: WidgetInstance[] = savedLayout.map((layoutItem: any) => {
          // Extract widget slug and index from layout item id
          const parts = layoutItem.i.split('-')
          const index = parseInt(parts[parts.length - 1])
          const widgetSlug = parts.slice(0, -1).join('-')

          // Find the original widget instance
          const originalWidget = dashboardConfig.defaultWidgets[index]

          return {
            height: layoutItem.h,
            widgetSlug: originalWidget?.widgetSlug || widgetSlug,
            width: layoutItem.w,
          }
        })

        savedWidgets = renderWidgets(savedWidgetInstances, savedLayout)
      }
    } catch {
      // If error loading preferences, use default
      savedWidgets = defaultWidgets
    }
  } else {
    // No user, use default
    savedWidgets = defaultWidgets
  }

  return (
    <div>
      <ModularDashboardClient
        defaultWidgets={defaultWidgets}
        savedWidgets={savedWidgets}
        widgets={renderedWidgetLibrary}
      />
    </div>
  )
}
