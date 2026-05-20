import type { AdminViewServerProps } from 'payload'

import { DashboardView as DashboardViewUI } from '@payloadcms/ui/views/Dashboard'
import { getDashboardData } from '@payloadcms/ui/views/Dashboard/getDashboardData'
import React from 'react'

import type { DashboardViewClientProps, DashboardViewServerPropsOnly } from './Default/index.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { DefaultDashboard } from './Default/index.js'

export async function DashboardView(props: AdminViewServerProps) {
  const {
    locale,
    permissions,
    req: {
      i18n,
      payload: { config },
      payload,
      user,
    },
    req,
    visibleEntities,
  } = props.initPageResult

  const { globalData, navGroups } = await getDashboardData(props)

  return (
    <DashboardViewUI permissions={permissions}>
      {RenderServerComponent({
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
          renderComponent: RenderServerComponent,
          user,
          visibleEntities,
        } satisfies DashboardViewServerPropsOnly,
      })}
    </DashboardViewUI>
  )
}
