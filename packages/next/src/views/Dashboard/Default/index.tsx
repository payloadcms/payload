import type { DashboardViewServerProps, ServerProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import './index.scss'
import { GridLayoutDashboard } from './GridLayout/server.js'

const baseClass = 'dashboard'

export function DefaultDashboard(props: DashboardViewServerProps) {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props
  const { afterDashboard, beforeDashboard } = payload.config.admin.components

  return (
    <div className={baseClass}>
      <Gutter className={`${baseClass}__wrap`}>
        {beforeDashboard &&
          RenderServerComponent({
            Component: beforeDashboard,
            importMap: payload.importMap,
            serverProps: {
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            } satisfies ServerProps,
          })}
        <GridLayoutDashboard {...props} />
        {afterDashboard &&
          RenderServerComponent({
            Component: afterDashboard,
            importMap: payload.importMap,
            serverProps: {
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            } satisfies ServerProps,
          })}
      </Gutter>
    </div>
  )
}
