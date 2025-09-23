/* eslint-disable no-restricted-exports */

import { type DashboardConfig } from 'payload'

interface CountProps {
  dashboardConfig: DashboardConfig
  widgetSlug: string
  // Add any other props you need from DashboardViewServerProps
}

export default function Count({ dashboardConfig, widgetSlug, ...props }: CountProps) {
  console.log('Widget props:', { dashboardConfig, widgetSlug, ...props })

  return (
    <div className="count-widget">
      <h2>Count Widget</h2>
      <p>Widget Slug: {widgetSlug}</p>
      <p>This is the count component</p>
      <div className="config-debug">
        <pre>{JSON.stringify(dashboardConfig, null, 2)}</pre>
      </div>
    </div>
  )
}
