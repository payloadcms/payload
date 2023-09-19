import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import { useAuth } from '../../../../utilities/Auth'
import { useConfig } from '../../../../utilities/Config'
import { type CollectionEditViewProps } from '../types'
import { RenderCustomView } from './RenderCustomView'
import { collectionCustomRoutes } from './custom'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../../Unauthorized'))

export const CollectionRoutes: React.FC<CollectionEditViewProps> = (props) => {
  const { collection, permissions } = props

  const match = useRouteMatch()

  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const { user } = useAuth()

  return (
    <Switch>
      <Route
        exact
        key={`${collection.slug}-versions`}
        path={`${adminRoute}/collections/${collection.slug}/:id/versions`}
      >
        {permissions?.readVersions?.permission ? (
          <RenderCustomView view="Versions" {...props} />
        ) : (
          <Unauthorized />
        )}
      </Route>
      <Route
        exact
        key={`${collection.slug}-view-version`}
        path={`${adminRoute}/collections/${collection.slug}/:id/versions/:versionID`}
      >
        {permissions?.readVersions?.permission ? (
          <RenderCustomView view="Version" {...props} />
        ) : (
          <Unauthorized />
        )}
      </Route>
      <Route
        exact
        key={`${collection.slug}-live-preview`}
        path={`${adminRoute}/collections/${collection.slug}/:id/preview`}
      >
        <RenderCustomView view="LivePreview" {...props} />
      </Route>
      {collectionCustomRoutes({
        collection,
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
