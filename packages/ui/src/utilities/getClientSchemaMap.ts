import type { I18n, I18nClient } from '@payloadcms/translations'
import type { ClientConfig, ClientFieldSchemaMap, FieldSchemaMap, Payload } from 'payload'

import { cache } from 'react'

import { buildClientFieldSchemaMap } from './buildClientFieldSchemaMap/index.js'

/**
 * Client field schema maps are cached per server field schema map they were built from
 * (which `getSchemaMap` rebuilds when the config changes), then per language and entity.
 * After a config reload in development, a request that is still rendering with the previous
 * config must not fill the cache that later requests (with the new config) read from.
 */
type CachedClientSchemaMaps = WeakMap<FieldSchemaMap, Map<string, ClientFieldSchemaMap>>

const getCachedClientSchemaMaps = (): CachedClientSchemaMaps => {
  if (
    !(global._payload_clientSchemaMap instanceof WeakMap) ||
    global._payload_doNotCacheClientSchemaMap
  ) {
    global._payload_clientSchemaMap = new WeakMap()
    global._payload_doNotCacheClientSchemaMap = false
  }

  return global._payload_clientSchemaMap
}

export const getClientSchemaMap = cache(
  (args: {
    collectionSlug?: string
    config: ClientConfig
    globalSlug?: string
    i18n: I18nClient
    payload: Payload
    schemaMap: FieldSchemaMap
    widgetSlug?: string
  }): ClientFieldSchemaMap => {
    const { collectionSlug, config, globalSlug, i18n, payload, schemaMap, widgetSlug } = args
    const cachedClientSchemaMaps = getCachedClientSchemaMaps()

    let clientSchemaMapsForSchemaMap = cachedClientSchemaMaps.get(schemaMap)

    if (!clientSchemaMapsForSchemaMap) {
      clientSchemaMapsForSchemaMap = new Map()
      cachedClientSchemaMaps.set(schemaMap, clientSchemaMapsForSchemaMap)
    }

    // Labels are translated while building the map, so it has to be cached per language
    const cacheKey = `${i18n.language}:${collectionSlug || globalSlug || `widget:${widgetSlug}`}`
    const cachedEntityClientFieldMap = clientSchemaMapsForSchemaMap.get(cacheKey)

    if (cachedEntityClientFieldMap) {
      return cachedEntityClientFieldMap
    }

    const { clientFieldSchemaMap: entityClientFieldMap } = buildClientFieldSchemaMap({
      collectionSlug,
      config,
      globalSlug,
      i18n: i18n as I18n,
      payload,
      schemaMap,
      widgetSlug,
    })

    clientSchemaMapsForSchemaMap.set(cacheKey, entityClientFieldMap)

    return entityClientFieldMap
  },
)
