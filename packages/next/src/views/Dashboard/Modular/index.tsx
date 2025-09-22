import type { DashboardViewServerProps } from '../Default/index.js'

import { ModularDashboardClient } from './client.js'
import './index.scss'

export function ModularDashboard(props: DashboardViewServerProps) {
  const {
    payload: {
      config: {
        admin: { dashboard: dashboardConfig },
      },
    },
  } = props

  return (
    <div>
      <h1>Modular Dashboard</h1>
      <ModularDashboardClient dashboardConfig={dashboardConfig} />
      <p>after dashboard</p>
    </div>
  )
}
