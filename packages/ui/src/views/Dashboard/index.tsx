export { DefaultDashboard } from './Default/index.js'
export type {
  DashboardViewClientProps,
  DashboardViewServerProps,
  DashboardViewServerPropsOnly,
} from './Default/index.js'

import type { AdminViewServerProps } from 'payload'

import React, { Fragment } from 'react'

import type { DashboardViewClientProps, DashboardViewServerPropsOnly } from './Default/index.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
/* eslint-disable payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds */
import { HydrateAuthProvider, SetStepNav } from '../../exports/client/index.js'
/* eslint-enable payload/no-imports-from-exports-dir */
import { getGlobalData } from '../../utilities/getGlobalData.js'
import { getNavGroups } from '../../utilities/getNavGroups.js'
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

  return (
    <Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <SetStepNav nav={[]} />
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
          server: req.server,
          user,
          visibleEntities,
        } satisfies DashboardViewServerPropsOnly,
      })}
    </Fragment>
  )
}
