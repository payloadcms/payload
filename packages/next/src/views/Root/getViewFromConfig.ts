import type {
  AdminViewServerProps,
  DocumentSubViewTypes,
  ImportMap,
  PayloadComponent,
  SanitizedConfig,
  ServerPropsFromView,
  ViewTypes,
} from 'payload'
import type React from 'react'

import { formatAdminURL } from 'payload/shared'

import type { initPage } from '../../utilities/initPage/index.js'

import { Account } from '../Account/index.js'
import { CreateFirstUserView } from '../CreateFirstUser/index.js'
import { Dashboard } from '../Dashboard/index.js'
import { Document as DocumentView } from '../Document/index.js'
import { forgotPasswordBaseClass, ForgotPasswordView } from '../ForgotPassword/index.js'
import { ListView } from '../List/index.js'
import { loginBaseClass, LoginView } from '../Login/index.js'
import { LogoutInactivity, LogoutView } from '../Logout/index.js'
import { ResetPassword, resetPasswordBaseClass } from '../ResetPassword/index.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { Verify, verifyBaseClass } from '../Verify/index.js'
import { attachViewActions, getViewActions } from './attachViewActions.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { getDocumentViewInfo } from './getDocumentViewInfo.js'
import { isPathMatchingRoute } from './isPathMatchingRoute.js'

const baseClasses = {
  account: 'account',
  forgot: forgotPasswordBaseClass,
  login: loginBaseClass,
  reset: resetPasswordBaseClass,
  verify: verifyBaseClass,
}

type OneSegmentViews = {
  [K in Exclude<keyof SanitizedConfig['admin']['routes'], 'reset'>]: React.FC<AdminViewServerProps>
}

export type ViewFromConfig = {
  Component?: React.FC<AdminViewServerProps>
  payloadComponent?: PayloadComponent<AdminViewServerProps>
}

const oneSegmentViews: OneSegmentViews = {
  account: Account,
  createFirstUser: CreateFirstUserView,
  forgot: ForgotPasswordView,
  inactivity: LogoutInactivity,
  login: LoginView,
  logout: LogoutView,
  unauthorized: UnauthorizedView,
}

type GetViewFromConfigArgs = {
  adminRoute: string
  config: SanitizedConfig
  currentRoute: string
  importMap: ImportMap
  searchParams: {
    [key: string]: string | string[]
  }
  segments: string[]
}

type GetViewFromConfigResult = {
  DefaultView: ViewFromConfig
  documentSubViewType?: DocumentSubViewTypes
  initPageOptions: Parameters<typeof initPage>[0]
  serverProps: ServerPropsFromView
  templateClassName: string
  templateType: 'default' | 'minimal'
  viewType?: ViewTypes
}

export const getViewFromConfig = ({
  adminRoute,
  config,
  currentRoute,
  importMap,
  searchParams,
  segments,
}: GetViewFromConfigArgs): GetViewFromConfigResult => {
  let ViewToRender: ViewFromConfig = null
  let templateClassName: string
  let templateType: 'default' | 'minimal' | undefined
  let documentSubViewType: DocumentSubViewTypes
  let viewType: ViewTypes

  const initPageOptions: Parameters<typeof initPage>[0] = {
    config,
    importMap,
    route: currentRoute,
    searchParams,
  }

  const [segmentOne, segmentTwo, segmentThree, segmentFour, segmentFive] = segments

  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'
  let matchedCollection: SanitizedConfig['collections'][number] = undefined
  let matchedGlobal: SanitizedConfig['globals'][number] = undefined

  const serverProps: ServerPropsFromView = {
    viewActions: config?.admin?.components?.actions || [],
  }

  if (isCollection) {
    matchedCollection = config.collections.find(({ slug }) => slug === segmentTwo)
    serverProps.collectionConfig = matchedCollection
  }

  if (isGlobal) {
    matchedGlobal = config.globals.find(({ slug }) => slug === segmentTwo)
    serverProps.globalConfig = matchedGlobal
  }

  switch (segments.length) {
    case 0: {
      if (currentRoute === adminRoute) {
        ViewToRender = {
          Component: Dashboard,
        }
        templateClassName = 'dashboard'
        templateType = 'default'
        viewType = 'dashboard'
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
          templateType = 'default'
          viewType = 'account'
        }
      }
      break
    }
    case 2: {
      if (`/${segmentOne}` === config.admin.routes.reset) {
        // --> /reset/:token
        ViewToRender = {
          Component: ResetPassword,
        }
        templateClassName = baseClasses[segmentTwo]
        templateType = 'minimal'
        viewType = 'reset'
      }

      if (isCollection && matchedCollection) {
        // --> /collections/:collectionSlug

        ViewToRender = {
          Component: ListView,
        }

        templateClassName = `${segmentTwo}-list`
        templateType = 'default'
        viewType = 'list'
        serverProps.viewActions = serverProps.viewActions.concat(
          matchedCollection.admin.components?.views?.list?.actions,
        )
      } else if (isGlobal && matchedGlobal) {
        // --> /globals/:globalSlug

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = 'global-edit'
        templateType = 'default'
        viewType = 'document'

        // add default view actions
        serverProps.viewActions = serverProps.viewActions.concat(
          getViewActions({
            editConfig: matchedGlobal.admin?.components?.views?.edit,
            viewKey: 'default',
          }),
        )
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
        viewType = 'verify'
      } else if (isCollection && matchedCollection) {
        // Custom Views
        // --> /collections/:collectionSlug/:id
        // --> /collections/:collectionSlug/:id/api
        // --> /collections/:collectionSlug/:id/preview
        // --> /collections/:collectionSlug/:id/versions
        // --> /collections/:collectionSlug/:id/versions/:versionID

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = `collection-default-edit`
        templateType = 'default'

        const viewInfo = getDocumentViewInfo([segmentFour, segmentFive])
        viewType = viewInfo.viewType
        documentSubViewType = viewInfo.documentSubViewType

        attachViewActions({
          collectionOrGlobal: matchedCollection,
          serverProps,
          viewKeyArg: documentSubViewType,
        })
      } else if (isGlobal && matchedGlobal) {
        // Custom Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/versions/:versionID
        // --> /globals/:globalSlug/api

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = `global-edit`
        templateType = 'default'

        const viewInfo = getDocumentViewInfo([segmentThree, segmentFour])
        viewType = viewInfo.viewType
        documentSubViewType = viewInfo.documentSubViewType

        attachViewActions({
          collectionOrGlobal: matchedGlobal,
          serverProps,
          viewKeyArg: documentSubViewType,
        })
      }
      break
  }

  if (!ViewToRender) {
    ViewToRender = getCustomViewByRoute({ config, currentRoute })?.view
  }

  serverProps.viewActions.reverse()

  return {
    DefaultView: ViewToRender,
    documentSubViewType,
    initPageOptions,
    serverProps,
    templateClassName,
    templateType,
    viewType,
  }
}
