import type { match } from 'react-router-dom'

import { lazy } from 'react'
import React from 'react'
import { Route } from 'react-router-dom'

import type { Permissions, User } from '../../../../auth'
import type { SanitizedCollectionConfig } from '../../../../collections/config/types'

import { DocumentInfoProvider } from '../../utilities/DocumentInfo'
import Version from '../Version'
import Versions from '../Versions'
import List from '../collections/List'
import { childRoutes } from './child'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Edit = lazy(() => import('../collections/Edit'))

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../Unauthorized'))

export const collectionRoutes = (props: {
  collections: SanitizedCollectionConfig[]
  match: match<{
    [key: string]: string | undefined
  }>
  permissions: Permissions
  user: User
}): React.ReactElement[] => {
  const { collections, match, permissions, user } = props

  // Note: `Route` must be directly nested within `Switch` for `useRouteMatch` to work
  // This means that we cannot use `Fragment` here with a simple map function to return an array of routes
  // Instead, we need to use `reduce` to return an array of routes directly within `Switch`
  return collections
    ?.filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
    .reduce((acc, collection) => {
      // Default routes
      const routesToReturn = [
        ...acc,
        <Route
          exact
          key={`${collection.slug}-list`}
          path={`${match.url}/collections/${collection.slug}`}
        >
          {permissions?.collections?.[collection.slug]?.read?.permission ? (
            <List collection={collection} />
          ) : (
            <Unauthorized />
          )}
        </Route>,
        <Route
          exact
          key={`${collection.slug}-create`}
          path={`${match.url}/collections/${collection.slug}/create`}
        >
          {permissions?.collections?.[collection.slug]?.create?.permission ? (
            <DocumentInfoProvider collection={collection} idFromParams>
              <Edit collection={collection} />
            </DocumentInfoProvider>
          ) : (
            <Unauthorized />
          )}
        </Route>,
        <Route
          exact
          key={`${collection.slug}-edit`}
          path={`${match.url}/collections/${collection.slug}/:id`}
        >
          {permissions?.collections?.[collection.slug]?.read?.permission ? (
            <DocumentInfoProvider collection={collection} idFromParams>
              <Edit collection={collection} isEditing />
            </DocumentInfoProvider>
          ) : (
            <Unauthorized />
          )}
        </Route>,
        childRoutes({
          collection,
          match,
          permissions,
          user,
        }),
      ]

      // Version routes
      if (collection.versions) {
        routesToReturn.push(
          <Route
            exact
            key={`${collection.slug}-versions`}
            path={`${match.url}/collections/${collection.slug}/:id/versions`}
          >
            {permissions?.collections?.[collection.slug]?.readVersions?.permission ? (
              <Versions collection={collection} />
            ) : (
              <Unauthorized />
            )}
          </Route>,
        )

        routesToReturn.push(
          <Route
            exact
            key={`${collection.slug}-view-version`}
            path={`${match.url}/collections/${collection.slug}/:id/versions/:versionID`}
          >
            {permissions?.collections?.[collection.slug]?.readVersions?.permission ? (
              <DocumentInfoProvider collection={collection} idFromParams>
                <Version collection={collection} />
              </DocumentInfoProvider>
            ) : (
              <Unauthorized />
            )}
          </Route>,
        )
      }

      return routesToReturn
    }, [])
}
