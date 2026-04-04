import type { AdminViewServerPropsOnly, ClientUser, Locale, ServerProps } from 'payload'

import React from 'react'

import type { groupNavItems } from '../../../utilities/groupNavItems.js'

import { Gutter } from '../../../elements/Gutter/index.js'

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
  navGroups?: ReturnType<typeof groupNavItems>
} & AdminViewServerPropsOnly

export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly

export type DefaultDashboardProps = {
  afterDashboard?: React.ReactNode
  beforeDashboard?: React.ReactNode
  children: React.ReactNode
}

export function DefaultDashboard({
  afterDashboard,
  beforeDashboard,
  children,
}: DefaultDashboardProps) {
  return (
    <Gutter className={baseClass}>
      {beforeDashboard}
      {children}
      {afterDashboard}
    </Gutter>
  )
}
