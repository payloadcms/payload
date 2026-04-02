import type { AdminViewServerPropsOnly, ClientUser, Locale, ServerProps } from 'payload'

import React from 'react'

import type { WithViewRenderer } from '../../../utilities/createViewRenderer.js'
import type { groupNavItems } from '../../../utilities/groupNavItems.js'

import { Gutter } from '../../../elements/Gutter/index.js'
import { createViewRenderer } from '../../../utilities/createViewRenderer.js'
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
} & AdminViewServerPropsOnly &
  WithViewRenderer

export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly

export function DefaultDashboard(props: DashboardViewServerProps) {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props
  const { afterDashboard, beforeDashboard } = payload.config.admin.components
  const renderView = props.viewRenderer ?? createViewRenderer({ importMap: payload.importMap })
  const serverProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user,
    viewRenderer: renderView,
  } satisfies ServerProps & WithViewRenderer

  return (
    <Gutter className={baseClass}>
      {beforeDashboard &&
        renderView({
          Component: beforeDashboard,
          serverProps,
        })}
      <ModularDashboard {...props} />
      {afterDashboard &&
        renderView({
          Component: afterDashboard,
          serverProps,
        })}
    </Gutter>
  )
}
