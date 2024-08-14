import type { PayloadServerReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

import './index.scss'

const baseClass = 'after-dashboard'

export const AfterDashboard: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['afterDashboard'][0]
> = () => {
  return (
    <div className={baseClass}>
      <h4>Test Config</h4>
      <p>
        The /test directory is used for create custom configurations and data seeding for developing
        features, writing e2e and integration testing.
      </p>
    </div>
  )
}
