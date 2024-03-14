import type { CollectionPermission, GlobalPermission, User } from 'payload/auth'
import type { EditViewComponent } from 'payload/config'
import type {
  AdminViewComponent,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { isEntityHidden } from 'payload/utilities'

import { APIView as DefaultAPIView } from '../API/index.js'
import { EditView as DefaultEditView } from '../Edit/index.js'
import { LivePreviewView as DefaultLivePreviewView } from '../LivePreview/index.js'
import { Unauthorized } from '../Unauthorized/index.js'
import { VersionView as DefaultVersionView } from '../Version/index.js'
import { VersionsView as DefaultVersionsView } from '../Versions/index.js'
import { getCustomViewByKey } from './getCustomViewByKey.js'
import { getCustomViewByPath } from './getCustomViewByPath.js'

export const getViewsFromConfig = ({
  collectionConfig,
  config,
  docPermissions,
  globalConfig,
  routeSegments,
  user,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  docPermissions: CollectionPermission | GlobalPermission
  globalConfig?: SanitizedGlobalConfig
  routeSegments: string[]
  user: User
}): {
  CustomView: EditViewComponent
  DefaultView: EditViewComponent
  /**
   * The error view to display if CustomView or DefaultView do not exist (could be either due to not found, or unauthorized). Can be null
   */
  ErrorView: AdminViewComponent
} | null => {
  // Conditionally import and lazy load the default view
  let DefaultView: EditViewComponent = null
  let CustomView: EditViewComponent = null
  let ErrorView: AdminViewComponent = null

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const livePreviewEnabled =
    (collectionConfig && collectionConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug) ||
    (globalConfig && globalConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.globals?.includes(globalConfig?.slug)

  if (collectionConfig) {
    const editConfig = collectionConfig?.admin?.components?.views?.Edit
    const EditOverride = typeof editConfig === 'function' ? editConfig : null

    if (EditOverride) {
      CustomView = EditOverride
    }

    if (!EditOverride) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [collectionEntity, collectionSlug, createOrID, nestedViewSlug, segmentFive] =
        routeSegments

      const {
        admin: { hidden },
      } = collectionConfig

      if (isEntityHidden({ hidden, user })) {
        return null
      }

      // `../:id`, or `../create`
      if (routeSegments.length === 3) {
        switch (createOrID) {
          case 'create': {
            if ('create' in docPermissions && docPermissions?.create?.permission) {
              CustomView = getCustomViewByKey(views, 'Default')
              DefaultView = DefaultEditView
            } else {
              ErrorView = Unauthorized
            }
            break
          }

          default: {
            if (docPermissions?.read?.permission) {
              CustomView = getCustomViewByKey(views, 'Default')
              DefaultView = DefaultEditView
            } else {
              ErrorView = Unauthorized
            }
          }
        }
      }

      // `../:id/api`, `../:id/preview`, `../:id/versions`, etc
      if (routeSegments?.length === 4) {
        switch (nestedViewSlug) {
          case 'api': {
            if (collectionConfig?.admin?.hideAPIURL !== true) {
              CustomView = getCustomViewByKey(views, 'API')
              DefaultView = DefaultAPIView
            }
            break
          }

          case 'preview': {
            if (livePreviewEnabled) {
              DefaultView = DefaultLivePreviewView
            }
            break
          }

          case 'versions': {
            if (docPermissions?.readVersions?.permission) {
              CustomView = getCustomViewByKey(views, 'Versions')
              DefaultView = DefaultVersionsView
            } else {
              ErrorView = Unauthorized
            }
            break
          }

          default: {
            const path = `/${nestedViewSlug}`
            CustomView = getCustomViewByPath(views, path)
            break
          }
        }
      }

      // `../:id/versions/:version`, etc
      if (routeSegments.length === 5) {
        if (nestedViewSlug === 'versions') {
          if (docPermissions?.readVersions?.permission) {
            CustomView = getCustomViewByKey(views, 'Version')
            DefaultView = DefaultVersionView
          } else {
            ErrorView = Unauthorized
          }
        }
      }
    }
  }

  if (globalConfig) {
    const editConfig = globalConfig?.admin?.components?.views?.Edit
    const EditOverride = typeof editConfig === 'function' ? editConfig : null

    if (EditOverride) {
      CustomView = EditOverride
    }

    if (!EditOverride) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [globalEntity, globalSlug, nestedViewSlug] = routeSegments

      const {
        admin: { hidden },
      } = globalConfig

      if (isEntityHidden({ hidden, user })) {
        return null
      }

      if (routeSegments?.length === 2) {
        if (docPermissions?.read?.permission) {
          CustomView = getCustomViewByKey(views, 'Default')
          DefaultView = DefaultEditView
        } else {
          ErrorView = Unauthorized
        }
      }

      if (routeSegments?.length === 3) {
        // `../:slug/api`, `../:slug/preview`, `../:slug/versions`, etc
        switch (nestedViewSlug) {
          case 'api': {
            if (globalConfig?.admin?.hideAPIURL !== true) {
              CustomView = getCustomViewByKey(views, 'API')
              DefaultView = DefaultAPIView
            }
            break
          }

          case 'preview': {
            if (livePreviewEnabled) {
              DefaultView = DefaultLivePreviewView
            }
            break
          }

          case 'versions': {
            if (docPermissions?.readVersions?.permission) {
              CustomView = getCustomViewByKey(views, 'Versions')
              DefaultView = DefaultVersionsView
            } else {
              ErrorView = Unauthorized
            }
            break
          }

          default: {
            if (docPermissions?.read?.permission) {
              CustomView = getCustomViewByKey(views, 'Default')
              DefaultView = DefaultEditView
            } else {
              ErrorView = Unauthorized
            }
            break
          }
        }
      }

      if (routeSegments?.length === 4) {
        // `../:slug/versions/:version`, etc
        if (nestedViewSlug === 'versions') {
          if (docPermissions?.readVersions?.permission) {
            CustomView = getCustomViewByKey(views, 'Version')
            DefaultView = DefaultVersionView
          } else {
            ErrorView = Unauthorized
          }
        }
      }
    }
  }

  return {
    CustomView,
    DefaultView,
    ErrorView,
  }
}
