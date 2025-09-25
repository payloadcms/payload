import type { CustomComponent, PayloadServerReactComponent } from 'payload'

import { Banner } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

export const AfterDashboardClient: PayloadServerReactComponent<CustomComponent> = ({ payload }) => {
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
