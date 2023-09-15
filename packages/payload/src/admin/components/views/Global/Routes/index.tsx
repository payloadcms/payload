import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import Version from '../../Version'
import VersionsView from '../../Versions'
import { DefaultGlobalView } from '../Default/index'
import { type Props } from '../types'
import { globalCustomRoutes } from './custom'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../Unauthorized'))

export const GlobalRoutes: React.FC<Props> = (props) => {
  const { global, permissions } = props

  const match = useRouteMatch()

  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const { user } = useAuth()

  return (
    <Switch>
      <Route
        exact
        key={`${global.slug}-versions`}
        path={`${adminRoute}/globals/${global.slug}/versions`}
      >
        {permissions?.readVersions?.permission ? (
          <VersionsView global={global} />
        ) : (
          <Unauthorized />
        )}
      </Route>
      <Route
        exact
        key={`${global.slug}-view-version`}
        path={`${adminRoute}/globals/${global.slug}/versions/:versionID`}
      >
        {permissions?.readVersions?.permission ? <Version global={global} /> : <Unauthorized />}
      </Route>
      {globalCustomRoutes({
        global,
        match,
        permissions,
        user,
      })}
      <Route>
        <DefaultGlobalView {...props} />
      </Route>
    </Switch>
  )
}
