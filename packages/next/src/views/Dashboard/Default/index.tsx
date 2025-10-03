import type { groupNavItems } from '@payloadcms/ui/shared'
import type { ClientUser, Locale, PayloadRequest, ServerProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { CollectionCards } from './CollectionCards.js'
import './index.scss'

export const baseClass = 'dashboard'

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
  navGroups?: ReturnType<typeof groupNavItems>
  req: PayloadRequest
} & ServerProps

export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly

export function DefaultDashboard(props: DashboardViewServerProps) {
  const {
    globalData,
    i18n,
    i18n: { t },
    locale,
    navGroups,
    params,
    payload: {
      config: {
        admin: {
          components: { afterDashboard, beforeDashboard },
        },
        routes: { admin: adminRoute },
      },
    },
    payload,
    permissions,
    searchParams,
    user,
  } = props

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

        <CollectionCards {...props} />
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
