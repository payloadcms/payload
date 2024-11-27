import type {
  AdminViewComponent,
  AdminViewProps,
  CustomComponent,
  EditConfig,
  ImportMap,
  SanitizedConfig,
} from 'payload'
import type React from 'react'

import { formatAdminURL } from '@payloadcms/ui/shared'

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
  inactivity: LogoutInactivity,
  login: LoginView,
  logout: LogoutView,
  unauthorized: UnauthorizedView,
}

function getViewActions({
  editConfig,
  viewKey,
}: {
  editConfig: EditConfig
  viewKey: keyof EditConfig
}): CustomComponent[] | undefined {
  if (editConfig && viewKey in editConfig && 'actions' in editConfig[viewKey]) {
    return editConfig[viewKey].actions
  }

  return undefined
}

type ServerPropsFromView = {
  collectionConfig?: SanitizedConfig['collections'][number]
  globalConfig?: SanitizedConfig['globals'][number]
  viewActions: CustomComponent[]
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
  initPageOptions: Parameters<typeof initPage>[0]
  serverProps: ServerPropsFromView
  templateClassName: string
  templateType: 'default' | 'minimal'
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
      }

      if (isCollection && matchedCollection) {
        // --> /collections/:collectionSlug

        ViewToRender = {
          Component: ListView,
        }

        templateClassName = `${segmentTwo}-list`
        templateType = 'default'
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
      } else if (isCollection && matchedCollection) {
        // Custom Views
        // --> /collections/:collectionSlug/:id
        // --> /collections/:collectionSlug/:id/api
        // --> /collections/:collectionSlug/:id/preview
        // --> /collections/:collectionSlug/:id/versions
        // --> /collections/:collectionSlug/:id/versions/:versionId

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = `collection-default-edit`
        templateType = 'default'

        // Adds view actions to the current collection view
        if (matchedCollection.admin?.components?.views?.edit) {
          if ('root' in matchedCollection.admin.components.views.edit) {
            serverProps.viewActions = serverProps.viewActions.concat(
              getViewActions({
                editConfig: matchedCollection.admin?.components?.views?.edit,
                viewKey: 'root',
              }),
            )
          } else {
            if (segmentFive) {
              if (segmentFour === 'versions') {
                // add version view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedCollection.admin?.components?.views?.edit,
                    viewKey: 'version',
                  }),
                )
              }
            } else if (segmentFour) {
              if (segmentFour === 'versions') {
                // add versions view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedCollection.admin?.components?.views.edit,
                    viewKey: 'versions',
                  }),
                )
              } else if (segmentFour === 'preview') {
                // add livePreview view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedCollection.admin?.components?.views.edit,
                    viewKey: 'livePreview',
                  }),
                )
              } else if (segmentFour === 'api') {
                // add api view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedCollection.admin?.components?.views.edit,
                    viewKey: 'api',
                  }),
                )
              }
            } else if (segmentThree) {
              // add default view actions
              serverProps.viewActions = serverProps.viewActions.concat(
                getViewActions({
                  editConfig: matchedCollection.admin?.components?.views.edit,
                  viewKey: 'default',
                }),
              )
            }
          }
        }
      } else if (isGlobal && matchedGlobal) {
        // Custom Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/versions/:versionId
        // --> /globals/:globalSlug/api

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = `global-edit`
        templateType = 'default'

        // Adds view actions to the current global view
        if (matchedGlobal.admin?.components?.views?.edit) {
          if ('root' in matchedGlobal.admin.components.views.edit) {
            serverProps.viewActions = serverProps.viewActions.concat(
              getViewActions({
                editConfig: matchedGlobal.admin.components?.views?.edit,
                viewKey: 'root',
              }),
            )
          } else {
            if (segmentFour) {
              if (segmentThree === 'versions') {
                // add version view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedGlobal.admin?.components?.views?.edit,
                    viewKey: 'version',
                  }),
                )
              }
            } else if (segmentThree) {
              if (segmentThree === 'versions') {
                // add versions view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedGlobal.admin?.components?.views?.edit,
                    viewKey: 'versions',
                  }),
                )
              } else if (segmentThree === 'preview') {
                // add livePreview view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedGlobal.admin?.components?.views?.edit,
                    viewKey: 'livePreview',
                  }),
                )
              } else if (segmentThree === 'api') {
                // add api view actions
                serverProps.viewActions = serverProps.viewActions.concat(
                  getViewActions({
                    editConfig: matchedGlobal.admin?.components?.views?.edit,
                    viewKey: 'api',
                  }),
                )
              }
            }
          }
        }
      }
      break
  }

  if (!ViewToRender) {
    ViewToRender = getCustomViewByRoute({ config, currentRoute })?.view
  }

  serverProps.viewActions.reverse()

  return {
    DefaultView: ViewToRender,
    initPageOptions,
    serverProps,
    templateClassName,
    templateType,
  }
}
