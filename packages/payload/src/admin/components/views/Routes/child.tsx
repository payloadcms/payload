import type { match } from 'react-router-dom'

import React from 'react'
import { Route } from 'react-router-dom'

import type { Permissions, User } from '../../../../auth'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../exports/types'

import Unauthorized from '../Unauthorized'

export const childRoutes = (props: {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  match: match<{
    [key: string]: string | undefined
  }>
  permissions: Permissions
  user: User
}): React.ReactElement[] => {
  const { collection, global, match, permissions, user } = props

  let customViews = []
  const internalViews = ['Default', 'Versions']

  const BaseEdit =
    collection?.admin?.components?.views?.Edit || global?.admin?.components?.views?.Edit

  if (typeof BaseEdit !== 'function' && typeof BaseEdit === 'object') {
    customViews = Object.entries(BaseEdit)
      .filter(([viewKey, view]) => {
        // Remove internal views from the list of custom views
        // This way we can easily iterate over the remaining views
        return Boolean(
          !internalViews.includes(viewKey) &&
            typeof view !== 'function' &&
            typeof view === 'object',
        )
      })
      ?.map(([, view]) => view)
  }

  return customViews?.reduce((acc, { Component, path }) => {
    const routesToReturn = [...acc]

    if (collection) {
      routesToReturn.push(
        <Route
          exact
          key={`${collection.slug}-${path}`}
          path={`${match.url}/collections/${collection.slug}/:id${path}`}
        >
          {permissions?.collections?.[collection.slug]?.read?.permission ? (
            <Component collection={collection} user={user} />
          ) : (
            <Unauthorized />
          )}
        </Route>,
      )
    }

    if (global) {
      routesToReturn.push(
        <Route
          exact
          key={`${global.slug}-${path}`}
          path={`${match.url}/globals/${global.slug}${path}`}
        >
          {permissions?.globals?.[global.slug]?.read?.permission ? (
            <Component global={global} />
          ) : (
            <Unauthorized />
          )}
        </Route>,
      )
    }

    return routesToReturn
  }, [])
}
