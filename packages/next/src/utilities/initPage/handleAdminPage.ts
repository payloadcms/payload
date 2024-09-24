import type {
  Permissions,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { notFound } from 'next/navigation.js'

import {
  getRouteWithoutAdmin,
  isAdminAuthRoute,
  isAdminRoute,
  isGraphQLPlaygroundRoute,
} from './shared.js'

export const handleAdminPage = ({
  adminRoute,
  config,
  permissions,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  permissions: Permissions
  route: string
}) => {
  if (isAdminRoute({ adminRoute, config, route })) {
    const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route })
    const routeSegments = routeWithoutAdmin.split('/').filter(Boolean)
    const [entityType, entitySlug, createOrID] = routeSegments
    const collectionSlug = entityType === 'collections' ? entitySlug : undefined
    const globalSlug = entityType === 'globals' ? entitySlug : undefined
    const docID = collectionSlug && createOrID !== 'create' ? createOrID : undefined

    let collectionConfig: SanitizedCollectionConfig | undefined
    let globalConfig: SanitizedGlobalConfig | undefined

    if (collectionSlug) {
      collectionConfig = config.collections.find((collection) => collection.slug === collectionSlug)

      if (!collectionConfig) {
        notFound()
      }
    }

    if (globalSlug) {
      globalConfig = config.globals.find((global) => global.slug === globalSlug)

      if (!globalConfig) {
        notFound()
      }
    }

    if (
      !permissions.canAccessAdmin &&
      !isAdminAuthRoute({ adminRoute, config, route }) &&
      !isGraphQLPlaygroundRoute({ adminRoute, config, route })
    ) {
      notFound()
    }

    return {
      collectionConfig,
      docID,
      globalConfig,
    }
  }

  return {}
}
