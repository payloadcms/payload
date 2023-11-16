import React from 'react'
import { Route } from 'react-router-dom'

import type { User } from '../../../../auth'
import type { SanitizedConfig } from '../../../../config/types'

export type adminViewType = 'Account' | 'Dashboard'

const internalViews: adminViewType[] = ['Account', 'Dashboard']

export const customRoutes = (props: {
  canAccessAdmin?: boolean
  config: SanitizedConfig
  match: { url: string }
  user: User | null | undefined
}) => {
  const { canAccessAdmin, config, match, user } = props

  const {
    admin: { components: { views: customViewConfigs } = {} },
  } = config

  const customViews = Object.entries(customViewConfigs || {})
    .filter(([viewKey, view]) => {
      // Remove internal views from the list of custom views
      // This way we can easily iterate over the remaining views
      return Boolean(
        !internalViews.includes(viewKey as any) &&
          typeof view !== 'function' &&
          typeof view === 'object',
      )
    })
    ?.map(([, view]) => view)

  if (Array.isArray(customViews)) {
    return customViews.map((CustomView) => {
      // You are responsible for ensuring that your own custom route is secure
      // i.e. return `Unauthorized` in your own component if the user does not have permission

      if (typeof CustomView === 'function') {
        return <CustomView user={user} />
      }

      const { Component, exact, path, sensitive, strict } = CustomView

      return (
        <Route
          exact={exact}
          key={`${match.url}${path}`}
          path={`${match.url}${path}`}
          sensitive={sensitive}
          strict={strict}
        >
          <Component canAccessAdmin={canAccessAdmin} user={user} />
        </Route>
      )
    })
  }

  return null
}
