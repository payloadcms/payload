import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import type { GlobalEditViewProps } from '../../types'

import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import NotFound from '../../NotFound'
import { CustomGlobalComponent } from './CustomComponent'
import { globalCustomRoutes } from './custom'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../Unauthorized'))

export const GlobalRoutes: React.FC<GlobalEditViewProps> = (props) => {
  const { global, permissions } = props

  const match = useRouteMatch()

  const {
    admin: { livePreview },
    routes: { admin: adminRoute },
  } = useConfig()

  const { user } = useAuth()

  const livePreviewEnabled =
    livePreview?.globals?.some((c) => c === global.slug) || global?.admin?.livePreview

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
      {global?.admin?.hideAPIURL !== true && (
        <Route exact key={`${global.slug}-api`} path={`${adminRoute}/globals/${global.slug}/api`}>
          {permissions?.read ? <CustomGlobalComponent view="API" {...props} /> : <Unauthorized />}
        </Route>
      )}
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
      {livePreviewEnabled && (
        <Route
          exact
          key={`${global.slug}-live-preview`}
          path={`${adminRoute}/globals/${global.slug}/preview`}
        >
          <CustomGlobalComponent view="LivePreview" {...props} />
        </Route>
      )}
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
