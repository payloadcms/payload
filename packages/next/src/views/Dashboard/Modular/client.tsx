'use client'

import { type ReactNode } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

interface RenderedWidget {
  component: ReactNode
  id: string
}

interface ModularDashboardClientProps {
  widgets: RenderedWidget[]
}

const ResponsiveGridLayout = WidthProvider(Responsive)

export function ModularDashboardClient({ widgets }: ModularDashboardClientProps) {
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
      {widgets.map((widget) => (
        <div className="widget" key={widget.id}>
          {widget.component}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
