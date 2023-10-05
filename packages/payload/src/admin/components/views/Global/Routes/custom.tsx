import type { match } from 'react-router-dom'

import React from 'react'
import { Route } from 'react-router-dom'

import type { GlobalPermission, User } from '../../../../../auth'
import type { SanitizedGlobalConfig } from '../../../../../exports/types'
import type { globalViewType } from './CustomComponent'

import Unauthorized from '../../Unauthorized'

export const globalCustomRoutes = (props: {
  global?: SanitizedGlobalConfig
  match: match<{
    [key: string]: string | undefined
  }>
  permissions: GlobalPermission
  user: User
}): React.ReactElement[] => {
  const { global, match, permissions, user } = props

  let customViews = []

  const internalViews: globalViewType[] = [
    'Default',
    'LivePreview',
    'Version',
    'Versions',
    'Relationships',
    'References',
    'API',
  ]

  const BaseEdit = global?.admin?.components?.views?.Edit

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

    if (global) {
      routesToReturn.push(
        <Route exact key={`${global.slug}-${path}`} path={`${match.url}${path}`}>
          {permissions?.read?.permission ? (
            <Component global={global} user={user} />
          ) : (
            <Unauthorized />
          )}
        </Route>,
      )
    }

    return routesToReturn
  }, [])
}
