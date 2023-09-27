import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import NotFound from '../../NotFound'
import { CustomGlobalComponent } from './CustomComponent'
import { globalCustomRoutes } from './custom'
import { EditViewProps } from '../../types'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../Unauthorized'))

export const GlobalRoutes: React.FC<EditViewProps> = (props) => {
  if ('global' in props) {
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
            <CustomGlobalComponent view="Versions" {...props} />
          ) : (
            <Unauthorized />
          )}
        </Route>
        <Route
          exact
          key={`${global.slug}-view-version`}
          path={`${adminRoute}/globals/${global.slug}/versions/:versionID`}
        >
          {permissions?.readVersions?.permission ? (
            <CustomGlobalComponent view="Version" {...props} />
          ) : (
            <Unauthorized />
          )}
        </Route>
        <Route
          exact
          key={`${global.slug}-live-preview`}
          path={`${adminRoute}/globals/${global.slug}/preview`}
        >
          <CustomGlobalComponent view="LivePreview" {...props} />
        </Route>
        {globalCustomRoutes({
          global,
          match,
          permissions,
          user,
        })}
        <Route exact key={`${global.slug}-view`} path={`${adminRoute}/globals/${global.slug}`}>
          <CustomGlobalComponent view="Default" {...props} />
        </Route>
        <Route path={`${match.url}*`}>
          <NotFound marginTop="large" />
        </Route>
      </Switch>
    )
  }

  return null
}
