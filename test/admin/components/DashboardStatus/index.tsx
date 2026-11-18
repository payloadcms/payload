import type { PayloadServerReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

import './index.css'

const baseClass = 'dashboard-status'

export const DashboardStatus: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['afterDashboard'][0]
> = () => {
  return (
    <div className={baseClass}>
      <span className={`${baseClass}__label`}>System status</span>
      <span className={`${baseClass}__badge`}>Operational</span>
    </div>
  )
}
