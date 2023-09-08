import type { match } from 'react-router-dom'

import { lazy } from 'react'
import React from 'react'
import { Route } from 'react-router-dom'

import type { Permissions, User } from '../../../../auth'
import type { SanitizedGlobalConfig } from '../../../../exports/types'

import { DocumentInfoProvider } from '../../utilities/DocumentInfo'
import Version from '../Version'
import Versions from '../Versions'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const EditGlobal = lazy(() => import('../Global'))

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Unauthorized = lazy(() => import('../Unauthorized'))

export const globalRoutes = (props: {
  globals: SanitizedGlobalConfig[]
  locale: string
  match: match<{
    [key: string]: string | undefined
  }>
  permissions: Permissions
  user: User
}): React.ReactElement[] => {
  const { globals, locale, match, permissions, user } = props

  // Note: `Route` must be directly nested within `Switch` for `useRouteMatch` to work
  // This means that we cannot use `Fragment` here with a simple map function to return an array of routes
  // Instead, we need to use `reduce` to return an array of routes directly within `Switch`
  return globals
    ?.filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
    .reduce((acc, global) => {
      const canReadGlobal = permissions?.globals?.[global.slug]?.read?.permission
      const canReadVersions = permissions?.globals?.[global.slug]?.readVersions?.permission

      // Default routes
      const routesToReturn = [
        ...acc,
        <Route exact key={global.slug} path={`${match.url}/globals/${global.slug}`}>
          {canReadGlobal ? (
            <DocumentInfoProvider global={global} idFromParams key={`${global.slug}-${locale}`}>
              <EditGlobal global={global} />
            </DocumentInfoProvider>
          ) : (
            <Unauthorized />
          )}
        </Route>,
      ]

      // Version routes
      if (global.versions) {
        routesToReturn.push(
          <Route
            exact
            key={`${global.slug}-versions`}
            path={`${match.url}/globals/${global.slug}/versions`}
          >
            {canReadVersions ? <Versions global={global} /> : <Unauthorized />}
          </Route>,
        )

        routesToReturn.push(
          <Route
            exact
            key={`${global.slug}-view-version`}
            path={`${match.url}/globals/${global.slug}/versions/:versionID`}
          >
            {canReadVersions ? <Version global={global} /> : <Unauthorized />}
          </Route>,
        )
      }

      return routesToReturn
    }, [])
}
