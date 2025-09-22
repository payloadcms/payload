'use client'

import { type DashboardConfig } from 'payload'
import GridLayout from 'react-grid-layout'

interface ModularDashboardClientProps {
  dashboardConfig?: DashboardConfig
}

export function ModularDashboardClient({ dashboardConfig }: ModularDashboardClientProps) {
  const layout = [
    { h: 2, i: 'a', w: 1, x: 0, y: 0 },
    { h: 2, i: 'b', maxW: 4, minW: 2, w: 3, x: 1, y: 0 },
    { h: 2, i: 'c', w: 1, x: 4, y: 0 },
  ]
  return (
    <GridLayout className="grid-layout" cols={12} layout={layout} rowHeight={30} width={1200}>
      <div className="widget" key="a">
        a
      </div>
      <div className="widget" key="b">
        b
      </div>
      <div className="widget" key="c">
        c
      </div>
    </GridLayout>
  )
}
