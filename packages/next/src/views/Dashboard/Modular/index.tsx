import type { WidgetInstance } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { DashboardViewServerProps } from '../Default/index.js'

import { ModularDashboardClient } from './client.js'
import './index.scss'

export type RenderedWidget = {
  component: React.ReactNode
} & WidgetInstance

export function ModularDashboard(props: DashboardViewServerProps) {
  const {
    payload: {
      config: {
        admin: { dashboard: dashboardConfig },
      },
      importMap,
    },
  } = props

  // Pre-render widgets on server side
  const renderedWidgets: RenderedWidget[] = React.useMemo(() => {
    if (!dashboardConfig?.defaultWidgets) {
      return []
    }

    return dashboardConfig.defaultWidgets.map((widget) => {
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
      }
    })
  }, [dashboardConfig, importMap, props])

  return (
    <div>
      <ModularDashboardClient widgets={renderedWidgets} />
    </div>
  )
}
