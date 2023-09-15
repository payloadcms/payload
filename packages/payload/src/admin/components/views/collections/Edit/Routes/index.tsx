import { lazy } from 'react'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

import { useAuth } from '../../../../utilities/Auth'
import { useConfig } from '../../../../utilities/Config'
import Version from '../../../Version'
import VersionsView from '../../../Versions'
import { DefaultEdit } from '../Default/index'
import { type Props } from '../types'
import { collectionCustomRoutes } from './custom'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../../../Unauthorized'))

export const CollectionRoutes: React.FC<Props> = (props) => {
  const { collection, id, permissions } = props

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
          <VersionsView collection={collection} id={id} />
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
          <Version collection={collection} />
        ) : (
          <Unauthorized />
        )}
      </Route>
      {collectionCustomRoutes({
        collection,
        match,
        permissions,
        user,
      })}
      <Route>
        <DefaultEdit {...props} />
      </Route>
    </Switch>
  )
}
