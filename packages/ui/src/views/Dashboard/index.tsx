import type { AdminViewServerProps } from 'payload'

import React, { Fragment } from 'react'

import type { ViewComponentRenderer } from '../../utilities/createViewRenderer.js'
import type { DashboardViewClientProps, DashboardViewServerPropsOnly } from './Default/index.js'

import { HydrateAuthProvider } from '../../elements/HydrateAuthProvider/index.js'
import { SetStepNav } from '../../elements/StepNav/SetStepNav.js'
import { createViewRenderer } from '../../utilities/createViewRenderer.js'
import { getGlobalData } from '../../utilities/getGlobalData.js'
import { getNavGroups } from '../../utilities/getNavGroups.js'
import { DefaultDashboard } from './Default/index.js'

export async function DashboardView(
  props: {
    viewRenderer?: ViewComponentRenderer
  } & AdminViewServerProps,
) {
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
  const renderView = props.viewRenderer ?? createViewRenderer({ importMap: payload.importMap })

  return (
    <Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <SetStepNav nav={[]} />
      {renderView({
        clientProps: {
          locale,
        } satisfies DashboardViewClientProps,
        Component: config.admin?.components?.views?.dashboard?.Component,
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
