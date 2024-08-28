'use client'
import type { PayloadServerReactComponent, SanitizedConfig } from 'payload'

import { RenderComponent, useConfig } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'after-dashboard'

export const AfterDashboard: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['afterDashboard'][0]
> = () => {
  const { config } = useConfig()
  return (
    <div className={baseClass}>
      <h4>Test Config</h4>
      <p>
        The /test directory is used for create custom configurations and data seeding for developing
        features, writing e2e and integration testing.
      </p>
      <p>Admin Dependency test component:</p>
      <RenderComponent mappedComponent={config.admin.dependencies?.myTestComponent} />
    </div>
  )
}
