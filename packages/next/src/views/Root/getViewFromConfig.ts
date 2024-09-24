import type { AdminViewComponent, AdminViewProps, ImportMap, SanitizedConfig } from 'payload'
import type React from 'react'

import { formatAdminURL } from '@payloadcms/ui/shared'

import type { initPage } from '../../utilities/initPage/index.js'

import { Account } from '../Account/index.js'
import { CreateFirstUserView } from '../CreateFirstUser/index.js'
import { Dashboard } from '../Dashboard/index.js'
import { Document as DocumentView } from '../Document/index.js'
import { forgotPasswordBaseClass, ForgotPasswordView } from '../ForgotPassword/index.js'
import { GraphQLPlayground } from '../GraphQLPlayground/index.js'
import { ListView } from '../List/index.js'
import { loginBaseClass, LoginView } from '../Login/index.js'
import { LogoutInactivity, LogoutView } from '../Logout/index.js'
import { ResetPassword, resetPasswordBaseClass } from '../ResetPassword/index.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { Verify, verifyBaseClass } from '../Verify/index.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { isPathMatchingRoute } from './isPathMatchingRoute.js'

const baseClasses = {
  account: 'account',
  forgot: forgotPasswordBaseClass,
  login: loginBaseClass,
  reset: resetPasswordBaseClass,
  verify: verifyBaseClass,
}

type OneSegmentViews = {
  [K in Exclude<keyof SanitizedConfig['admin']['routes'], 'reset'>]: React.FC<AdminViewProps>
}

export type ViewFromConfig = {
  Component?: React.FC<AdminViewProps>
  payloadComponent?: AdminViewComponent
}

const oneSegmentViews: OneSegmentViews = {
  account: Account,
  createFirstUser: CreateFirstUserView,
  forgot: ForgotPasswordView,
  graphqlPlayground: GraphQLPlayground,
  inactivity: LogoutInactivity,
  login: LoginView,
  logout: LogoutView,
  unauthorized: UnauthorizedView,
}

export const getViewFromConfig = ({
  adminRoute,
  config,
  currentRoute,
  importMap,
  searchParams,
  segments,
}: {
  adminRoute: string
  config: SanitizedConfig
  currentRoute: string
  importMap: ImportMap
  searchParams: {
    [key: string]: string | string[]
  }
  segments: string[]
}): {
  DefaultView: ViewFromConfig
  initPageOptions: Parameters<typeof initPage>[0]
  templateClassName: string
  templateType: 'default' | 'minimal'
} => {
  let ViewToRender: ViewFromConfig = null
  let templateClassName: string
  let templateType: 'default' | 'minimal' | undefined

  const initPageOptions: Parameters<typeof initPage>[0] = {
    config,
    importMap,
    route: currentRoute,
    searchParams,
  }

  const [segmentOne, segmentTwo] = segments

  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'

  switch (segments.length) {
    case 0: {
      if (currentRoute === adminRoute) {
        ViewToRender = {
          Component: Dashboard,
        }
        templateClassName = 'dashboard'
        templateType = 'default'
        initPageOptions.redirectUnauthenticatedUser = true
      }
      break
    }
    case 1: {
      // users can override the default routes via `admin.routes` config
      // i.e.{ admin: { routes: { logout: '/sign-out', inactivity: '/idle' }}}
      let viewKey: keyof typeof oneSegmentViews

      if (config.admin.routes) {
        const matchedRoute = Object.entries(config.admin.routes).find(([, route]) => {
          return isPathMatchingRoute({
            currentRoute,
            exact: true,
            path: formatAdminURL({ adminRoute, path: route }),
          })
        })

        if (matchedRoute) {
          viewKey = matchedRoute[0] as keyof typeof oneSegmentViews
        }
      }

      if (oneSegmentViews[viewKey]) {
        // --> /account
        // --> /create-first-user
        // --> /forgot
        // --> /login
        // --> /logout
        // --> /logout-inactivity
        // --> /unauthorized

        ViewToRender = {
          Component: oneSegmentViews[viewKey],
        }

        templateClassName = baseClasses[viewKey]
        templateType = 'minimal'

        if (viewKey === 'account') {
          initPageOptions.redirectUnauthenticatedUser = true
          templateType = 'default'
        }

        if (viewKey === 'graphqlPlayground') {
          templateType = undefined
        }
      }
      break
    }
    case 2: {
      if (segmentOne === 'reset') {
        // --> /reset/:token
        ViewToRender = {
          Component: ResetPassword,
        }
        templateClassName = baseClasses[segmentTwo]
        templateType = 'minimal'
      }

      if (isCollection) {
        // --> /collections/:collectionSlug
        initPageOptions.redirectUnauthenticatedUser = true

        ViewToRender = {
          Component: ListView,
        }

        templateClassName = `${segmentTwo}-list`
        templateType = 'default'
      } else if (isGlobal) {
        // --> /globals/:globalSlug
        initPageOptions.redirectUnauthenticatedUser = true

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = 'global-edit'
        templateType = 'default'
      }
      break
    }
    default:
      if (segmentTwo === 'verify') {
        // --> /:collectionSlug/verify/:token
        ViewToRender = {
          Component: Verify,
        }

        templateClassName = 'verify'
        templateType = 'minimal'
      } else if (isCollection) {
        // Custom Views
        // --> /collections/:collectionSlug/:id
        // --> /collections/:collectionSlug/:id/preview
        // --> /collections/:collectionSlug/:id/versions
        // --> /collections/:collectionSlug/:id/versions/:versionId
        // --> /collections/:collectionSlug/:id/api
        initPageOptions.redirectUnauthenticatedUser = true

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = `collection-default-edit`
        templateType = 'default'
      } else if (isGlobal) {
        // Custom Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/versions/:versionId
        // --> /globals/:globalSlug/api
        initPageOptions.redirectUnauthenticatedUser = true

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = `global-edit`
        templateType = 'default'
      }
      break
  }

  if (!ViewToRender) {
    ViewToRender = getCustomViewByRoute({ config, currentRoute })?.view
  }

  return {
    DefaultView: ViewToRender,
    initPageOptions,
    templateClassName,
    templateType,
  }
}
