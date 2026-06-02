import type { groupNavItems } from '@payloadcms/ui/shared'
import type { AdminViewServerPropsOnly, ClientUser, Locale, ServerProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { ModularDashboard } from './ModularDashboard/index.js'

const baseClass = 'dashboard'

export type DashboardViewClientProps = {
  locale: Locale
}

// Neither DashboardViewClientProps, DashboardViewServerPropsOnly, nor
// DashboardViewServerProps make much sense. They were created
// before the modular dashboard existed, and they are tightly coupled to
// the default layout of collection and global cards. All of their values
// could have been derived from the req object, and the same likely applies
// to other views. These types remain only for backward compatibility.
// It is recommended to use the modular dashboard widgets, which have props
// that are more agnostic to their content.

export type DashboardViewServerPropsOnly = AdminViewServerPropsOnly & {
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  navGroups?: ReturnType<typeof groupNavItems>
}

export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly

export function DefaultDashboard(props: DashboardViewServerProps) {
  const { i18n, locale, params, payload, permissions, searchParams, server, user } = props
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
            server,
            user,
          } satisfies ServerProps,
        })}
      <ModularDashboard {...props} />
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
            server,
            user,
          } satisfies ServerProps,
        })}
    </Gutter>
  )
}
