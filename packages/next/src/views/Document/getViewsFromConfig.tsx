import type { CollectionPermission, GlobalPermission, User } from 'payload/auth'
import type { EditViewComponent } from 'payload/config'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import type React from 'react'

import { isEntityHidden } from 'payload/utilities'

import type { AdminViewProps } from '../Root/index.js'

import { APIView as DefaultAPIView } from '../API/index.js'
import { EditView as DefaultEditView } from '../Edit/index.js'
import { LivePreviewView as DefaultLivePreviewView } from '../LivePreview/index.js'
import { NotFoundClient } from '../NotFound/index.client.js'
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
  ErrorView: React.FC<AdminViewProps>
} | null => {
  // Conditionally import and lazy load the default view
  let DefaultView: EditViewComponent = null
  let CustomView: EditViewComponent = null
  let ErrorView: React.FC = null

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const livePreviewEnabled =
    (collectionConfig && collectionConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug) ||
    (globalConfig && globalConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.globals?.includes(globalConfig?.slug)

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, createOrID, nestedViewSlug, segmentFive] =
      routeSegments

    const {
      admin: { hidden },
    } = collectionConfig

    if (isEntityHidden({ hidden, user })) {
      return null
    }

    // `../:id`, or `../create`
    if (!nestedViewSlug) {
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

    if (nestedViewSlug) {
      // `../:id/versions/:version`, etc
      if (segmentFive) {
        if (nestedViewSlug === 'versions') {
          if (docPermissions?.readVersions?.permission) {
            CustomView = getCustomViewByKey(views, 'Version')
            DefaultView = DefaultVersionView
          } else {
            ErrorView = Unauthorized
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
    }
  }

  if (globalConfig) {
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
    } else if (routeSegments?.length === 3) {
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
    } else if (routeSegments?.length === 4) {
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

  return {
    CustomView,
    DefaultView,
    ErrorView,
  }
}
