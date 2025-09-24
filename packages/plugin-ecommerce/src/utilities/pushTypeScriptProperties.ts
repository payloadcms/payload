import type { I18n } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'
import type { Field, SanitizedConfig } from 'payload'

import { fieldsToJSONSchema, flattenAllFields } from 'payload'

import type { SanitizedEcommercePluginConfig } from '../types.js'

export const pushTypeScriptProperties = ({
  collectionIDFieldTypes,
  config,
  i18n,
  jsonSchema,
  sanitizedPluginConfig,
}: {
  collectionIDFieldTypes: {
    [key: string]: 'number' | 'string'
  }
  config: SanitizedConfig
  i18n: I18n
  jsonSchema: JSONSchema4
  sanitizedPluginConfig: SanitizedEcommercePluginConfig
}): JSONSchema4 => {
  if (!jsonSchema.properties) {
    jsonSchema.properties = {}
  }

  const interfaceNameDefinitions = new Map()

  if (Array.isArray(jsonSchema.required)) {
    jsonSchema.required.push('ecommerce')
  }

  const requiredProperties = ['cartsCollectionSlug']

  jsonSchema.properties.ecommerce = {
    type: 'object',
    additionalProperties: false,
    properties: {
      cartsCollection: {
        $ref: `#/definitions/carts`,
      },
    },
    required: requiredProperties,
  }

  return jsonSchema
}
