import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import type { CollectionEditViewProps } from '../../../types'

import { useAuth } from '../../../../utilities/Auth'
import { useConfig } from '../../../../utilities/Config'
import NotFound from '../../../NotFound'
import { CustomCollectionComponent } from './CustomComponent'
import { collectionCustomRoutes } from './custom'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../../Unauthorized'))

export const CollectionRoutes: React.FC<CollectionEditViewProps> = (props) => {
  const { collection, permissions } = props

  const match = useRouteMatch()

  const {
    admin: { livePreview },
    routes: { admin: adminRoute },
  } = useConfig()

  const { user } = useAuth()

  const livePreviewEnabled =
    livePreview?.collections?.some((c) => c === collection.slug) || collection?.admin?.livePreview

  return (
    <Switch>
      <Route
        exact
        key={`${collection.slug}-versions`}
        path={`${adminRoute}/collections/${collection.slug}/:id/versions`}
      >
        {permissions?.readVersions?.permission ? (
          <CustomCollectionComponent view="Versions" {...props} />
        ) : (
          <Unauthorized />
        )}
      </Route>
      {collection?.admin?.hideAPIURL !== true && (
        <Route
          exact
          key={`${collection.slug}-api`}
          path={`${adminRoute}/collections/${collection.slug}/:id/api`}
        >
          {permissions?.read ? (
            <CustomCollectionComponent view="API" {...props} />
          ) : (
            <Unauthorized />
          )}
        </Route>
      )}
      <Route
        exact
        key={`${collection.slug}-view-version`}
        path={`${adminRoute}/collections/${collection.slug}/:id/versions/:versionID`}
      >
        {permissions?.readVersions?.permission ? (
          <CustomCollectionComponent view="Version" {...props} />
        ) : (
          <Unauthorized />
        )}
      </Route>
      {livePreviewEnabled && (
        <Route
          exact
          key={`${collection.slug}-live-preview`}
          path={`${adminRoute}/collections/${collection.slug}/:id/preview`}
        >
          <CustomCollectionComponent view="LivePreview" {...props} />
        </Route>
      )}
      {collectionCustomRoutes({
        collection,
        match,
        permissions,
        user,
      })}
      <Route
        exact
        key={`${collection.slug}-view`}
        path={`${adminRoute}/collections/${collection.slug}/:id`}
      >
        <CustomCollectionComponent view="Default" {...props} />
      </Route>
      <Route path={`${match.url}*`}>
        <NotFound marginTop="large" />
      </Route>
    </Switch>
  )
}
