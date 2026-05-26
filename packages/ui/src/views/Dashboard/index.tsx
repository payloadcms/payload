import type { AdminViewServerProps, ComponentRenderer, SanitizedPermissions } from 'payload'

import React, { Fragment } from 'react'

import type { DashboardViewClientProps, DashboardViewServerPropsOnly } from './Default/index.js'

import { HydrateAuthProvider } from '../../elements/HydrateAuthProvider/index.js'
import { SetStepNav } from '../../elements/StepNav/SetStepNav.js'
import { getDashboardData } from './getDashboardData.js'

export type DashboardLayoutProps = {
  children: React.ReactNode
  permissions: SanitizedPermissions
}

export function DashboardLayout({ children, permissions }: DashboardLayoutProps) {
  return (
    <Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <SetStepNav nav={[]} />
      {children}
    </Fragment>
  )
}

export type DashboardViewProps = {
  DefaultDashboard: React.ComponentType<any>
  renderComponent: ComponentRenderer
} & AdminViewServerProps

export async function DashboardView({
  DefaultDashboard,
  renderComponent,
  ...props
}: DashboardViewProps) {
  const {
    initPageResult: {
      locale,
      permissions,
      req: {
        i18n,
        payload,
        payload: { config },
        user,
      },
      visibleEntities,
    },
  } = props

  const { globalData, navGroups } = await getDashboardData(props)

  return (
    <DashboardLayout permissions={permissions}>
      {renderComponent({
        clientProps: {
          locale,
        } satisfies DashboardViewClientProps,
        Component: config.admin?.components?.views?.dashboard?.Component,
        Fallback: DefaultDashboard,
        importMap: payload.importMap,
        serverProps: {
          ...props,
          globalData,
          i18n,
          locale,
          navGroups,
          payload,
          permissions,
          renderComponent,
          user,
          visibleEntities,
        } satisfies DashboardViewServerPropsOnly,
      })}
    </DashboardLayout>
  )
}
