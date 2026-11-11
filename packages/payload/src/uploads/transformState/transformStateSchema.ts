import type { JSONSchema4 } from 'json-schema'

const nonNegativeInteger: JSONSchema4 = { type: 'integer', minimum: 0 }
const positiveInteger: JSONSchema4 = { type: 'integer', minimum: 1 }
const percentage: JSONSchema4 = { type: 'number', maximum: 100, minimum: 0 }

const strictObject = (
  schema: Pick<JSONSchema4, 'description' | 'properties' | 'required'>,
): JSONSchema4 => ({ type: 'object', additionalProperties: false, ...schema })

/**
 * Shapes for the built-in `_transforms` keys. Any other key is allowed and owned by the
 * transformer that reads it.
 */
export const transformStateObjectSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: true,
  properties: {
    clip: strictObject({
      description: 'Time range on the original, in milliseconds. Start inclusive, end exclusive.',
      properties: { endMs: positiveInteger, startMs: nonNegativeInteger },
      required: ['startMs', 'endMs'],
    }),
    crop: strictObject({
      description: 'Rectangle in original-file pixels, applied before resize and encoding.',
      properties: {
        height: positiveInteger,
        width: positiveInteger,
        x: nonNegativeInteger,
        y: nonNegativeInteger,
      },
      required: ['x', 'y', 'width', 'height'],
    }),
    encoding: {
      type: 'object',
      description: 'Encoding settings for the output format. Does not select the format.',
    },
    flip: strictObject({
      description: 'Mirror the image on one or both axes.',
      properties: { horizontal: { type: 'boolean' }, vertical: { type: 'boolean' } },
    }),
    focalPoint: strictObject({
      description: 'Preferred point as percentages of the original, from 0 to 100.',
      properties: { x: percentage, y: percentage },
      required: ['x', 'y'],
    }),
    metadataPolicy: strictObject({
      description: 'Keep or remove metadata embedded in the output file.',
      properties: { mode: { type: 'string', enum: ['preserve', 'strip'] } },
      required: ['mode'],
    }),
    pageRange: strictObject({
      description: 'One-based, inclusive page range on the original document.',
      properties: { endPage: positiveInteger, startPage: positiveInteger },
      required: ['startPage', 'endPage'],
    }),
    posterFrame: strictObject({
      description: 'Video frame to use as the poster, in milliseconds on the original.',
      properties: { timestampMs: nonNegativeInteger },
      required: ['timestampMs'],
    }),
    resize: strictObject({
      description: 'Target size for visual media.',
      properties: {
        fit: { type: 'string', enum: ['contain', 'cover', 'fill', 'inside', 'outside'] },
        height: positiveInteger,
        width: positiveInteger,
        withoutEnlargement: { type: 'boolean' },
      },
    }),
    rotate: strictObject({
      description: 'Clockwise rotation in degrees.',
      properties: { angle: { type: 'number' } },
      required: ['angle'],
    }),
  },
}

export const transformStateSchema: JSONSchema4 = {
  anyOf: [transformStateObjectSchema, { type: 'null' }],
}
