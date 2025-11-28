import type { groupNavItems } from '@payloadcms/ui/shared'
import type { AdminViewServerPropsOnly, ClientUser, Locale, ServerProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { GridLayoutDashboard } from './GridLayout/server.js'

const baseClass = 'dashboard'

export type DashboardViewClientProps = {
  locale: Locale
}

export type DashboardViewServerPropsOnly = {
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  Link?: React.ComponentType

  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   */
  navGroups?: ReturnType<typeof groupNavItems>
} & AdminViewServerPropsOnly

export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly

export function DefaultDashboard(props: DashboardViewServerProps) {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props
  const { afterDashboard, beforeDashboard } = payload.config.admin.components

  return (
    <Gutter className={baseClass}>
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
  )
}
