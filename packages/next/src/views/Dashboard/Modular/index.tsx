import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { DashboardViewServerProps } from '../Default/index.js'

import { ModularDashboardClient } from './client.js'
import './index.scss'

interface RenderedWidget {
  component: React.ReactNode
  height: number
  id: string
  width: number
}

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
    if (!dashboardConfig?.defaults) {
      return []
    }

    return dashboardConfig.defaults.map((widget) => {
      const WidgetComponent = RenderServerComponent({
        Component: widget.Component,
        importMap,
        serverProps: {
          ...props,
          dashboardConfig,
          widgetSlug: widget.slug,
        },
      })

      return {
        id: widget.slug,
        component: WidgetComponent,
        height: widget.height,
        width: widget.width,
      }
    })
  }, [dashboardConfig, importMap, props])

  return (
    <div>
      <h1>Modular Dashboard</h1>
      <ModularDashboardClient widgets={renderedWidgets} />
      <p>after dashboard</p>
    </div>
  )
}
