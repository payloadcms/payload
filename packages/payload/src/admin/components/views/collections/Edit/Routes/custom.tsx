import type { match } from 'react-router-dom'

import React from 'react'
import { Route } from 'react-router-dom'

import type { CollectionPermission, User } from '../../../../../../auth'
import type { SanitizedCollectionConfig } from '../../../../../../exports/types'
import type { collectionViewType } from './CustomComponent'

import Unauthorized from '../../../Unauthorized'

export const collectionCustomRoutes = (props: {
  collection?: SanitizedCollectionConfig
  match: match<{
    [key: string]: string | undefined
  }>
  permissions: CollectionPermission
  user: User
}): React.ReactElement[] => {
  const { collection, match, permissions, user } = props

  let customViews = []

  const internalViews: collectionViewType[] = [
    'Default',
    'LivePreview',
    'Version',
    'Versions',
    'Relationships',
    'References',
    'API',
  ]

  const BaseEdit = collection?.admin?.components?.views?.Edit

  if (typeof BaseEdit !== 'function' && typeof BaseEdit === 'object') {
    customViews = Object.entries(BaseEdit)
      .filter(([viewKey, view]) => {
        // Remove internal views from the list of custom views
        // This way we can easily iterate over the remaining views
        return Boolean(
          !internalViews.includes(viewKey as any) &&
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
        <Route exact key={`${collection.slug}-${path}`} path={`${match.url}${path}`}>
          {permissions?.read?.permission ? (
            <Component collection={collection} user={user} />
          ) : (
            <Unauthorized />
          )}
        </Route>,
      )
    }

    return routesToReturn
  }, [])
}
