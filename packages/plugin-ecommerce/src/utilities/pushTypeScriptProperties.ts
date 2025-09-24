import type { I18n } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'
import type { SanitizedConfig } from 'payload'

import type { CollectionSlugMap, SanitizedEcommercePluginConfig } from '../types/index.js'

export const pushTypeScriptProperties = ({
  collectionSlugMap,
  jsonSchema,
}: {
  collectionSlugMap: CollectionSlugMap
  config: SanitizedConfig
  jsonSchema: JSONSchema4
  sanitizedPluginConfig: SanitizedEcommercePluginConfig
}): JSONSchema4 => {
  if (!jsonSchema.properties) {
    jsonSchema.properties = {}
  }

  if (Array.isArray(jsonSchema.required)) {
    jsonSchema.required.push('ecommerce')
  }

  const requiredCollectionProperties: string[] = []
  const propertiesMap = new Map<string, { $ref: string }>()

  Object.entries(collectionSlugMap).forEach(([key, slug]) => {
    propertiesMap.set(key, { $ref: `#/definitions/${slug}` })

    requiredCollectionProperties.push(slug)
  })

  console.log({ collectionSlugMap, propertiesMap })
  jsonSchema.properties.ecommerce = {
    type: 'object',
    additionalProperties: false,
    properties: {
      collections: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...Object.fromEntries(propertiesMap),
        },
        required: requiredCollectionProperties,
      },
    },
    required: ['collections'],
  }

  return jsonSchema
}
