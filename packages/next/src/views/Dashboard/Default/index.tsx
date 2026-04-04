import type { ServerProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { DefaultDashboard as DefaultDashboardUI } from '@payloadcms/ui/views/Dashboard/Default'
import React from 'react'

import { ModularDashboard } from './ModularDashboard/index.js'

export type {
  DashboardViewClientProps,
  DashboardViewServerProps,
  DashboardViewServerPropsOnly,
} from '@payloadcms/ui/views/Dashboard/Default'

export type { DefaultDashboardProps } from '@payloadcms/ui/views/Dashboard/Default'

import type { DashboardViewServerProps } from '@payloadcms/ui/views/Dashboard/Default'

export function DefaultDashboard(props: DashboardViewServerProps) {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props
  const { afterDashboard, beforeDashboard } = payload.config.admin.components

  const serverProps: ServerProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user,
  }

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
      <ModularDashboard {...props} />
    </DefaultDashboardUI>
  )
}
