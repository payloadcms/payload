import type { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload'

import { getRouteWithoutAdmin, isAdminRoute } from './shared.js'

type Args = {
  adminRoute: string
  config: SanitizedConfig
  route: string
}
type RouteInfo = {
  collectionConfig?: SanitizedCollectionConfig
  collectionSlug?: string
  docID?: string
  globalConfig?: SanitizedGlobalConfig
  globalSlug?: string
}

export function getRouteInfo({ adminRoute, config, route }: Args): RouteInfo {
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
    }

    if (globalSlug) {
      globalConfig = config.globals.find((global) => global.slug === globalSlug)
    }

    return {
      collectionConfig,
      collectionSlug,
      docID,
      globalConfig,
      globalSlug,
    }
  }

  return {}
}
