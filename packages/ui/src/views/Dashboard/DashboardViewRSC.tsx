import type { AdminViewServerProps, ServerProps, WidgetServerProps } from 'payload'

import React from 'react'

import type {
  DashboardViewClientProps,
  DashboardViewServerProps,
  DashboardViewServerPropsOnly,
} from './Default/index.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { DefaultDashboard as DefaultDashboardUI } from './Default/index.js'
import { getModularDashboardData } from './Default/ModularDashboard/getModularDashboardData.js'
import { ModularDashboard as ModularDashboardUI } from './Default/ModularDashboard/index.js'
import { getDashboardData } from './getDashboardData.js'
import { DashboardView as DashboardViewUI } from './index.js'

/**
 * Framework-agnostic Default Dashboard server component — resolves the
 * `beforeDashboard` / `afterDashboard` slots via `RenderServerComponent`,
 * fetches the modular widget layout, then renders the presentational
 * `DefaultDashboardUI` wrapper.
 */
async function DefaultDashboardServer(props: DashboardViewServerProps) {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props
  const { afterDashboard, beforeDashboard } = payload.config.admin.components
  const { cookies, permissions: initPermissions, req } = props.initPageResult

  const serverProps: ServerProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    renderComponent: RenderServerComponent,
    searchParams,
    user,
  }

  const { clientWidgets, layoutItems } = await getModularDashboardData({ req, user })

  const clientLayout = layoutItems.map((item) => ({
    component: RenderServerComponent({
      Component: item.widgetComponent,
      importMap: payload.importMap,
      serverProps: {
        cookies,
        locale,
        permissions: initPermissions,
        renderComponent: RenderServerComponent,
        req,
        widgetData: item.widgetData,
        widgetSlug: item.widgetSlug,
      } satisfies WidgetServerProps,
    }),
    item: {
      id: item.id,
      data: item.data,
      maxWidth: item.maxWidth,
      minWidth: item.minWidth,
      width: item.width,
    },
  }))

  return (
    <DefaultDashboardUI
      afterDashboard={
        afterDashboard
          ? RenderServerComponent({
              Component: afterDashboard,
              importMap: payload.importMap,
              serverProps,
            })
          : undefined
      }
      beforeDashboard={
        beforeDashboard
          ? RenderServerComponent({
              Component: beforeDashboard,
              importMap: payload.importMap,
              serverProps,
            })
          : undefined
      }
    >
      <ModularDashboardUI clientLayout={clientLayout} clientWidgets={clientWidgets} />
    </DefaultDashboardUI>
  )
}

/**
 * Framework-agnostic Dashboard view RSC.
 *
 * Fetches dashboard data (nav groups, global states) and renders the configured
 * dashboard view component (falling back to `DefaultDashboardServer`).
 */
export const DashboardViewRSC = async (props: AdminViewServerProps) => {
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
        Fallback: DefaultDashboardServer,
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
