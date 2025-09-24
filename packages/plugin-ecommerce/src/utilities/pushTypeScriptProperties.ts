import type { I18n } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'
import type { SanitizedConfig } from 'payload'

import type { SanitizedEcommercePluginConfig } from '../types.js'

export const pushTypeScriptProperties = ({
  jsonSchema,
}: {
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

  const requiredProperties = ['addressesCollection', 'cartsCollection']

  jsonSchema.properties.ecommerce = {
    type: 'object',
    additionalProperties: false,
    properties: {
      addressesCollection: {
        $ref: `#/definitions/addresses`,
      },
      cartsCollection: {
        $ref: `#/definitions/carts`,
      },
    },
    required: requiredProperties,
  }

  return jsonSchema
}
