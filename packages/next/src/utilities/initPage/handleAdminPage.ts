import type {
  Permissions,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { notFound } from 'next/navigation.js'

import { isAdminAuthRoute, isAdminRoute } from './shared.js'

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
  if (isAdminRoute(route, adminRoute)) {
    const routeSegments = route.replace(adminRoute, '').split('/').filter(Boolean)
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

    if (!permissions.canAccessAdmin && !isAdminAuthRoute(config, route, adminRoute)) {
      notFound()
    }

    return {
      collectionConfig,
      docID,
      globalConfig,
    }
  }
}
