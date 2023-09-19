import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import { type GlobalEditViewProps } from '../types'
import { RenderCustomView } from './RenderCustomView'
import { globalCustomRoutes } from './custom'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../Unauthorized'))

export const GlobalRoutes: React.FC<GlobalEditViewProps> = (props) => {
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
          <RenderCustomView view="Versions" {...props} />
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
          <RenderCustomView view="Version" {...props} />
        ) : (
          <Unauthorized />
        )}
      </Route>
      <Route
        exact
        key={`${global.slug}-live-preview`}
        path={`${adminRoute}/globals/${global.slug}/preview`}
      >
        <RenderCustomView view="LivePreview" {...props} />
      </Route>
      {globalCustomRoutes({
        global,
        match,
        permissions,
        user,
      })}
      <Route>
        <RenderCustomView view="Default" {...props} />
      </Route>
    </Switch>
  )
}
