import type { JSONSchema4 } from 'json-schema'

const nonNegativeInteger: JSONSchema4 = { type: 'integer', minimum: 0 }
const positiveInteger: JSONSchema4 = { type: 'integer', minimum: 1 }
const percentage: JSONSchema4 = { type: 'number', maximum: 100, minimum: 0 }

/**
 * Built-in keys that Payload will define but does not apply yet. They are rejected so that no
 * stored value can conflict with the built-in shape when it is added.
 */
export const reservedTransformKeys = [
  'clip',
  'encoding',
  'flip',
  'metadataPolicy',
  'pageRange',
  'posterFrame',
  'resize',
  'rotate',
]

/**
 * Shapes for the built-in `_transforms` keys. Any other key is allowed and owned by the
 * transformer that reads it.
 */
export const transformStateObjectSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: true,
  properties: {
    crop: {
      type: 'object',
      additionalProperties: false,
      description: 'Rectangle in original-file pixels, applied before resize and encoding.',
      properties: {
        height: positiveInteger,
        width: positiveInteger,
        x: nonNegativeInteger,
        y: nonNegativeInteger,
      },
      required: ['x', 'y', 'width', 'height'],
    },
    focalPoint: {
      type: 'object',
      additionalProperties: false,
      description: 'Preferred point as percentages of the original, from 0 to 100.',
      properties: { x: percentage, y: percentage },
      required: ['x', 'y'],
    },
  },
}

export const transformStateSchema: JSONSchema4 = {
  anyOf: [transformStateObjectSchema, { type: 'null' }],
}
