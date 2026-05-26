import type { AdminViewServerProps } from 'payload'

import { DashboardView as DashboardViewBase } from '@payloadcms/ui/views/Dashboard'
import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { DefaultDashboard } from './Default/index.js'

export function DashboardView(props: AdminViewServerProps) {
  return (
    <DashboardViewBase
      {...props}
      DefaultDashboard={DefaultDashboard}
      renderComponent={RenderServerComponent}
    />
  )
}
