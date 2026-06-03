import type { ClientWidget } from 'payload'

import React from 'react'

import type { WidgetInstanceClient } from './index.client.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir to keep the `'use client'` boundary on `ModularDashboardClient` (relative imports collapse the boundary in @vitejs/plugin-rsc, causing "Invalid hook call" during RSC render).
import { ModularDashboardClient } from '../../../../exports/client/index.js'
import './index.css'

export type ModularDashboardProps = {
  clientLayout: WidgetInstanceClient[]
  clientWidgets: ClientWidget[]
}

export function ModularDashboard({ clientLayout, clientWidgets }: ModularDashboardProps) {
  return (
    <div>
      <ModularDashboardClient clientLayout={clientLayout} widgets={clientWidgets} />
    </div>
  )
}
