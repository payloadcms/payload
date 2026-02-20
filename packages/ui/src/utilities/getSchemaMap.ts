import type { I18n, I18nClient } from '@payloadcms/translations'
import type { FieldSchemaMap, SanitizedConfig } from 'payload'

import { cache } from 'react'

import { buildFieldSchemaMap } from './buildFieldSchemaMap/index.js'

let cachedSchemaMap = global._payload_schemaMap

if (!cachedSchemaMap) {
  cachedSchemaMap = global._payload_schemaMap = null
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

    if (!cachedSchemaMap || global._payload_doNotCacheSchemaMap) {
      cachedSchemaMap = new Map()
    }

    const cacheKey =
      collectionSlug || globalSlug || (widgetSlug ? `widget:${widgetSlug}` : undefined)
    let cachedEntityFieldMap = cachedSchemaMap.get(cacheKey)

    if (cachedEntityFieldMap) {
      return cachedEntityFieldMap
    }

    cachedEntityFieldMap = new Map()

    const { fieldSchemaMap: entityFieldMap } = buildFieldSchemaMap({
      collectionSlug,
      config,
      globalSlug,
      i18n: i18n as I18n,
      widgetSlug,
    })

    cachedSchemaMap.set(cacheKey, entityFieldMap)

    global._payload_schemaMap = cachedSchemaMap

    global._payload_doNotCacheSchemaMap = false

    return entityFieldMap
  },
)
