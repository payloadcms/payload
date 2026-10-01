import type { CustomComponent, PayloadServerReactComponent } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { Banner } from '../Banner/index.js'

export const AfterDashboardClient: PayloadServerReactComponent<CustomComponent> = ({ payload }) => {
  if (!payload?.config || !payload?.importMap) {
    return (
      <Banner>
        <p>Admin Dependency test component:</p>
        <p>No payload context available</p>
      </Banner>
    )
  }

  return (
    <Banner>
      <p>Admin Dependency test component:</p>
      {RenderServerComponent({
        Component: payload.config.admin.dependencies?.myTestComponent,
        importMap: payload.importMap,
      })}
    </Banner>
  )
}
