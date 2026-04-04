import type { SanitizedPermissions } from 'payload'

import React, { Fragment } from 'react'

import { HydrateAuthProvider } from '../../elements/HydrateAuthProvider/index.js'
import { SetStepNav } from '../../elements/StepNav/SetStepNav.js'

export type DashboardViewProps = {
  children: React.ReactNode
  permissions: SanitizedPermissions
}

export function DashboardView({ children, permissions }: DashboardViewProps) {
  return (
    <Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <SetStepNav nav={[]} />
      {children}
    </Fragment>
  )
}
