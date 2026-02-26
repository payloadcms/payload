import type { AdminViewServerProps } from 'payload'

import { HydrateAuthProvider, SetStepNav } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getGlobalData, getNavGroups } from '@payloadcms/ui/shared'
import React, { Fragment } from 'react'

import type { DashboardViewClientProps, DashboardViewServerPropsOnly } from './Default/index.js'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'
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

  const globalData = await getGlobalData(req)
  const navGroups = getNavGroups(permissions, visibleEntities, config, i18n)

  const adminConfig = getAdminConfig()

  return (
    <Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <SetStepNav nav={[]} />
      {RenderServerComponent({
        clientProps: {
          locale,
        } satisfies DashboardViewClientProps,
        Component: adminConfig.admin?.views?.dashboard?.Component as any,
        Fallback: DefaultDashboard,
        serverProps: {
          ...props,
          globalData,
          i18n,
          locale,
          navGroups,
          payload,
          permissions,
          user,
          visibleEntities,
        } satisfies DashboardViewServerPropsOnly,
      })}
    </Fragment>
  )
}
