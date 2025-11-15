import type { PayloadServerReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'empty-dashboard'

export const EmptyDashboard: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['emptyDashboard'][0]
> = () => {
  return (
    <div className={baseClass}>
      <h4>Empty Dashboard</h4>
      <p>This is a custom empty dashboard component.</p>
    </div>
  )
}
