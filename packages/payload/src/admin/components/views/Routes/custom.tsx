import React from 'react'
import { Route } from 'react-router-dom'

import type { User } from '../../../../auth'
import type { SanitizedConfig } from '../../../../exports/config'

export const customRoutes = (props: {
  canAccessAdmin: boolean
  customRoutes: SanitizedConfig['admin']['components']['routes']
  match: { url: string }
  user: User
}) => {
  const { canAccessAdmin, customRoutes, match, user } = props

  if (Array.isArray(customRoutes)) {
    return customRoutes.map(({ Component, exact, path, sensitive, strict }) => (
      <Route
        exact={exact}
        key={`${match.url}${path}`}
        path={`${match.url}${path}`}
        sensitive={sensitive}
        strict={strict}
      >
        <Component canAccessAdmin={canAccessAdmin} user={user} />
      </Route>
    ))
  }

  return null
}
