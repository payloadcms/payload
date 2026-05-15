import type { ClientWidget } from 'payload'

import React from 'react'

import type { WidgetInstanceClient } from './index.client.js'

import { ModularDashboardClient } from './index.client.js'
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
