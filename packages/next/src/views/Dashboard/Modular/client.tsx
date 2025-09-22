'use client'

import { type DashboardConfig } from 'payload'
import { Responsive, WidthProvider } from 'react-grid-layout'

interface ModularDashboardClientProps {
  dashboardConfig?: DashboardConfig
}

const ResponsiveGridLayout = WidthProvider(Responsive)

export function ModularDashboardClient({ dashboardConfig }: ModularDashboardClientProps) {
  const layout = [
    { h: 2, i: 'a', w: 1, x: 0, y: 0 },
    { h: 2, i: 'b', maxW: 4, minW: 2, w: 3, x: 1, y: 0 },
    { h: 2, i: 'c', w: 1, x: 4, y: 0 },
  ]

  return (
    <ResponsiveGridLayout
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      className="grid-layout"
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      //   layout={layout}
      rowHeight={100}
      //   width={1200} not needed / doesn't have effect when using WidthProvider
      //   resizeHandle
      //   onLayoutChange={onLayoutChange}
    >
      <div className="widget" key="a">
        a
      </div>
      <div className="widget" key="b">
        b
      </div>
      <div className="widget" key="c">
        c
      </div>
    </ResponsiveGridLayout>
  )
}
