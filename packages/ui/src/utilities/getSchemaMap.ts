import type { I18n, I18nClient } from '@payloadcms/translations'
import type { FieldSchemaMap, SanitizedConfig } from 'payload'

import { cache } from 'react'

import { buildFieldSchemaMap } from './buildFieldSchemaMap/index.js'

/**
 * Field schema maps are cached per config object they were built from, then per entity.
 * After a config reload in development, a request that is still rendering with the previous
 * config must not fill the cache that later requests (with the new config) read from.
 */
type CachedSchemaMaps = WeakMap<SanitizedConfig, Map<string, FieldSchemaMap>>

const getCachedSchemaMaps = (): CachedSchemaMaps => {
  if (!(global._payload_schemaMap instanceof WeakMap) || global._payload_doNotCacheSchemaMap) {
    global._payload_schemaMap = new WeakMap()
    global._payload_doNotCacheSchemaMap = false
  }

  return global._payload_schemaMap
}

export const getSchemaMap = cache(
  (args: {
    collectionSlug?: string
    config: SanitizedConfig
    globalSlug?: string
    i18n: I18nClient
    widgetSlug?: string
  }): FieldSchemaMap => {
    const { collectionSlug, config, globalSlug, i18n, widgetSlug } = args
    const cachedSchemaMaps = getCachedSchemaMaps()

    let schemaMapsForConfig = cachedSchemaMaps.get(config)

    if (!schemaMapsForConfig) {
      schemaMapsForConfig = new Map()
      cachedSchemaMaps.set(config, schemaMapsForConfig)
    }

    const cacheKey = collectionSlug || globalSlug || `widget:${widgetSlug}`
    const cachedEntityFieldMap = schemaMapsForConfig.get(cacheKey)

    if (cachedEntityFieldMap) {
      return cachedEntityFieldMap
    }

    const { fieldSchemaMap: entityFieldMap } = buildFieldSchemaMap({
      collectionSlug,
      config,
      globalSlug,
      i18n: i18n as I18n,
      widgetSlug,
    })

    schemaMapsForConfig.set(cacheKey, entityFieldMap)

    return entityFieldMap
  },
)
