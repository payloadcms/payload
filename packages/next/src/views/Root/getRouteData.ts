import type {
  AdminViewServerProps,
  CollectionPreferences,
  CollectionSlug,
  CustomComponent,
  DocumentSubViewTypes,
  Payload,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  ViewTypes,
} from 'payload'
import type React from 'react'

import { parseDocumentID } from 'payload'
import { formatAdminURL, isNumber } from 'payload/shared'

import { AccountView } from '../Account/index.js'
import { BrowseByFolder } from '../BrowseByFolder/index.js'
import { CollectionFolderView } from '../CollectionFolders/index.js'
import { TrashView } from '../CollectionTrash/index.js'
import { CreateFirstUserView } from '../CreateFirstUser/index.js'
import { DashboardView } from '../Dashboard/index.js'
import { DocumentView } from '../Document/index.js'
import { forgotPasswordBaseClass, ForgotPasswordView } from '../ForgotPassword/index.js'
import { ListView } from '../List/index.js'
import { loginBaseClass, LoginView } from '../Login/index.js'
import { LogoutInactivity, LogoutView } from '../Logout/index.js'
import { ResetPassword, resetPasswordBaseClass } from '../ResetPassword/index.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { Verify, verifyBaseClass } from '../Verify/index.js'
import { getSubViewActions, getViewActions } from './attachViewActions.js'
import { getCustomViewByKey } from './getCustomViewByKey.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { getDocumentViewInfo } from './getDocumentViewInfo.js'
import { isPathMatchingRoute } from './isPathMatchingRoute.js'

const baseClasses = {
  account: 'account',
  folders: 'folders',
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
  account: AccountView,
  browseByFolder: BrowseByFolder,
  createFirstUser: CreateFirstUserView,
  forgot: ForgotPasswordView,
  inactivity: LogoutInactivity,
  login: LoginView,
  logout: LogoutView,
  unauthorized: UnauthorizedView,
}

type GetRouteDataResult = {
  browseByFolderSlugs: CollectionSlug[]
  collectionConfig?: SanitizedCollectionConfig
  DefaultView: ViewFromConfig
  documentSubViewType?: DocumentSubViewTypes
  globalConfig?: SanitizedGlobalConfig
  routeParams: {
    collection?: string
    folderCollection?: string
    folderID?: number | string
    global?: string
    id?: number | string
    token?: string
    versionID?: number | string
  }
  templateClassName: string
  templateType: 'default' | 'minimal'
  viewActions?: CustomComponent[]
  viewType?: ViewTypes
}

type GetRouteDataArgs = {
  adminRoute: string
  collectionConfig?: SanitizedCollectionConfig
  /**
   * User preferences for a collection.
   *
   * These preferences are normally undefined
   * unless the user is on the list view and the
   * collection is folder enabled.
   */
  collectionPreferences?: CollectionPreferences
  currentRoute: string
  globalConfig?: SanitizedGlobalConfig
  payload: Payload
  searchParams: {
    [key: string]: string | string[]
  }
  segments: string[]
}

export const getRouteData = ({
  adminRoute,
  collectionConfig,
  collectionPreferences = undefined,
  currentRoute,
  globalConfig,
  payload,
  segments,
}: GetRouteDataArgs): GetRouteDataResult => {
  const { config } = payload
  let ViewToRender: ViewFromConfig = null
  let templateClassName: string
  let templateType: 'default' | 'minimal' | undefined
  let documentSubViewType: DocumentSubViewTypes
  let viewType: ViewTypes
  const routeParams: GetRouteDataResult['routeParams'] = {}

  const [segmentOne, segmentTwo, segmentThree, segmentFour, segmentFive, segmentSix] = segments

  const isBrowseByFolderEnabled = config.folders && config.folders.browseByFolder
  const browseByFolderSlugs =
    (isBrowseByFolderEnabled &&
      config.collections.reduce((acc, { slug, folders }) => {
        if (folders && folders.browseByFolder) {
          return [...acc, slug]
        }
        return acc
      }, [])) ||
    []

  const viewActions: CustomComponent[] = [...(config?.admin?.components?.actions || [])]

  switch (segments.length) {
    case 0: {
      if (currentRoute === adminRoute) {
        ViewToRender = {
          Component: DashboardView,
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
            path: formatAdminURL({
              adminRoute,
              path: route,
            }),
          })
        })

        if (matchedRoute) {
          viewKey = matchedRoute[0] as keyof typeof oneSegmentViews
        }
      }

      // Check if a custom view is configured for this viewKey
      // First try to get custom view by the known viewKey, then fallback to route matching
      const customView =
        (viewKey && getCustomViewByKey({ config, viewKey })) ||
        getCustomViewByRoute({ config, currentRoute })

      if (customView?.view?.payloadComponent || customView?.view?.Component) {
        // User has configured a custom view (either overriding a built-in or a new custom view)
        ViewToRender = customView.view

        // If this custom view is overriding a built-in view (viewKey matches a built-in),
        // use the built-in's template settings and viewType
        if (viewKey && oneSegmentViews[viewKey]) {
          viewType = viewKey as ViewTypes
          templateClassName = baseClasses[viewKey] || viewKey
          templateType = 'minimal'

          if (viewKey === 'account') {
            templateType = 'default'
          }

          if (isBrowseByFolderEnabled && viewKey === 'browseByFolder') {
            templateType = 'default'
            viewType = 'folders'
          }
        }
      } else if (oneSegmentViews[viewKey]) {
        // --> /account
        // --> /create-first-user
        // --> /browse-by-folder
        // --> /forgot
        // --> /login
        // --> /logout
        // --> /logout-inactivity
        // --> /unauthorized

        ViewToRender = {
          Component: oneSegmentViews[viewKey],
        }

        viewType = viewKey as ViewTypes

        templateClassName = baseClasses[viewKey]
        templateType = 'minimal'

        if (viewKey === 'account') {
          templateType = 'default'
        }

        if (isBrowseByFolderEnabled && viewKey === 'browseByFolder') {
          templateType = 'default'
          viewType = 'folders'
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
      } else if (
        isBrowseByFolderEnabled &&
        `/${segmentOne}` === config.admin.routes.browseByFolder
      ) {
        // --> /browse-by-folder/:folderID
        routeParams.folderID = segmentTwo

        ViewToRender = {
          Component: oneSegmentViews.browseByFolder,
        }
        templateClassName = baseClasses.folders
        templateType = 'default'
        viewType = 'folders'
      } else if (collectionConfig) {
        // --> /collections/:collectionSlug'
        routeParams.collection = collectionConfig.slug

        if (
          collectionPreferences?.listViewType &&
          collectionPreferences.listViewType === 'folders'
        ) {
          // Render folder view by default if set in preferences
          ViewToRender = {
            Component: CollectionFolderView,
          }

          templateClassName = `collection-folders`
          templateType = 'default'
          viewType = 'collection-folders'
        } else {
          ViewToRender = {
            Component: ListView,
          }

          templateClassName = `${segmentTwo}-list`
          templateType = 'default'
          viewType = 'list'
        }

        viewActions.push(...(collectionConfig.admin.components?.views?.list?.actions || []))
      } else if (globalConfig) {
        // --> /globals/:globalSlug
        routeParams.global = globalConfig.slug

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = 'global-edit'
        templateType = 'default'
        viewType = 'document'

        // add default view actions
        viewActions.push(
          ...getViewActions({
            editConfig: globalConfig.admin?.components?.views?.edit,
            viewKey: 'default',
          }),
        )
      }
      break
    }
    default:
      if (segmentTwo === 'verify') {
        // --> /:collectionSlug/verify/:token
        routeParams.collection = segmentOne
        routeParams.token = segmentThree

        ViewToRender = {
          Component: Verify,
        }

        templateClassName = 'verify'
        templateType = 'minimal'
        viewType = 'verify'
      } else if (collectionConfig) {
        routeParams.collection = collectionConfig.slug

        if (segmentThree === 'trash' && typeof segmentFour === 'string') {
          // --> /collections/:collectionSlug/trash/:id (read-only)
          // --> /collections/:collectionSlug/trash/:id/api
          // --> /collections/:collectionSlug/trash/:id/preview
          // --> /collections/:collectionSlug/trash/:id/versions
          // --> /collections/:collectionSlug/trash/:id/versions/:versionID
          routeParams.id = segmentFour
          routeParams.versionID = segmentSix

          ViewToRender = {
            Component: DocumentView,
          }

          templateClassName = `collection-default-edit`
          templateType = 'default'

          const viewInfo = getDocumentViewInfo([segmentFive, segmentSix])
          viewType = viewInfo.viewType
          documentSubViewType = viewInfo.documentSubViewType

          viewActions.push(
            ...getSubViewActions({
              collectionOrGlobal: collectionConfig,
              viewKeyArg: documentSubViewType,
            }),
          )
        } else if (segmentThree === 'trash') {
          // --> /collections/:collectionSlug/trash
          ViewToRender = {
            Component: TrashView,
          }

          templateClassName = `${segmentTwo}-trash`
          templateType = 'default'
          viewType = 'trash'

          viewActions.push(...(collectionConfig.admin.components?.views?.list?.actions || []))
        } else {
          if (config.folders && segmentThree === config.folders.slug && collectionConfig.folders) {
            // Collection Folder Views
            // --> /collections/:collectionSlug/:folderCollectionSlug
            // --> /collections/:collectionSlug/:folderCollectionSlug/:folderID
            routeParams.folderCollection = segmentThree
            routeParams.folderID = segmentFour

            ViewToRender = {
              Component: CollectionFolderView,
            }

            templateClassName = `collection-folders`
            templateType = 'default'
            viewType = 'collection-folders'

            viewActions.push(...(collectionConfig.admin.components?.views?.list?.actions || []))
          } else {
            // Collection Edit Views
            // --> /collections/:collectionSlug/create
            // --> /collections/:collectionSlug/:id
            // --> /collections/:collectionSlug/:id/api
            // --> /collections/:collectionSlug/:id/versions
            // --> /collections/:collectionSlug/:id/versions/:versionID
            routeParams.id = segmentThree === 'create' ? undefined : segmentThree
            routeParams.versionID = segmentFive

            ViewToRender = {
              Component: DocumentView,
            }

            templateClassName = `collection-default-edit`
            templateType = 'default'

            const viewInfo = getDocumentViewInfo([segmentFour, segmentFive])
            viewType = viewInfo.viewType
            documentSubViewType = viewInfo.documentSubViewType

            viewActions.push(
              ...getSubViewActions({
                collectionOrGlobal: collectionConfig,
                viewKeyArg: documentSubViewType,
              }),
            )
          }
        }
      } else if (globalConfig) {
        // Global Edit Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/versions/:versionID
        // --> /globals/:globalSlug/api
        routeParams.global = globalConfig.slug
        routeParams.versionID = segmentFour

        ViewToRender = {
          Component: DocumentView,
        }

        templateClassName = `global-edit`
        templateType = 'default'

        const viewInfo = getDocumentViewInfo([segmentThree, segmentFour])
        viewType = viewInfo.viewType
        documentSubViewType = viewInfo.documentSubViewType

        viewActions.push(
          ...getSubViewActions({
            collectionOrGlobal: globalConfig,
            viewKeyArg: documentSubViewType,
          }),
        )
      }
      break
  }

  if (!ViewToRender) {
    ViewToRender = getCustomViewByRoute({ config, currentRoute })?.view
  }

  if (collectionConfig) {
    if (routeParams.id) {
      routeParams.id = parseDocumentID({
        id: routeParams.id,
        collectionSlug: collectionConfig.slug,
        payload,
      })
    }

    if (routeParams.versionID) {
      routeParams.versionID = parseDocumentID({
        id: routeParams.versionID,
        collectionSlug: collectionConfig.slug,
        payload,
      })
    }
  }

  if (config.folders && routeParams.folderID) {
    routeParams.folderID = parseDocumentID({
      id: routeParams.folderID,
      collectionSlug: config.folders.slug,
      payload,
    })
  }

  if (globalConfig && routeParams.versionID) {
    routeParams.versionID =
      payload.db.defaultIDType === 'number' && isNumber(routeParams.versionID)
        ? Number(routeParams.versionID)
        : routeParams.versionID
  }

  if (viewActions.length) {
    viewActions.reverse()
  }

  return {
    browseByFolderSlugs,
    collectionConfig,
    DefaultView: ViewToRender,
    documentSubViewType,
    globalConfig,
    routeParams,
    templateClassName,
    templateType,
    viewActions: viewActions.length ? viewActions : undefined,
    viewType,
  }
}
