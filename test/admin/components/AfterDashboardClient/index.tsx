'use client'
import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { RenderComponent, useConfig } from '@payloadcms/ui'
import React from 'react'

export const AfterDashboardClient: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['afterDashboard'][0]
> = () => {
  const { config } = useConfig()
  return (
    <div>
      <p>Admin Dependency test component:</p>
      <RenderComponent mappedComponent={config.admin.dependencies?.myTestComponent} />
    </div>
  )
}
