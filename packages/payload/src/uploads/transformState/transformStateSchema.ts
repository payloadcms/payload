import { z } from 'zod'

import type { JSONField } from '../../fields/config/types.js'

const dimension = z.number().int().positive()
const offset = z.number().int().nonnegative()

export const imageEncodingSchema = z.strictObject({
  progressive: z.boolean().optional(),
  quality: z.number().int().min(1).max(100).optional(),
})

export const videoEncodingSchema = z.strictObject({
  audioCodec: z.string().min(1).optional(),
  frameRate: z.number().positive().optional(),
  profile: z.string().min(1).optional(),
  videoBitrate: dimension.optional(),
  videoCodec: z.string().min(1).optional(),
})

export const pdfEncodingSchema = z.strictObject({
  downsampleImagesToDpi: dimension.optional(),
  linearize: z.boolean().optional(),
  profile: z.string().min(1).optional(),
  removeHiddenObjects: z.boolean().optional(),
  stripMetadata: z.boolean().optional(),
})

export const transformStateSchema = z
  .object({
    clip: z.strictObject({ endMs: offset, startMs: offset }).optional(),
    crop: z
      .strictObject({ height: dimension, width: dimension, x: offset, y: offset })
      .describe('Rectangle in orientation-normalized original pixels, before resizing.')
      .optional(),
    encoding: z.union([imageEncodingSchema, videoEncodingSchema, pdfEncodingSchema]).optional(),
    flip: z
      .strictObject({ horizontal: z.boolean().optional(), vertical: z.boolean().optional() })
      .optional(),
    focalPoint: z
      .strictObject({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .describe('Preferred point in original-space percentages, from 0 to 100.')
      .optional(),
    metadataPolicy: z.strictObject({ mode: z.enum(['preserve', 'strip']) }).optional(),
    pageRange: z.strictObject({ endPage: dimension, startPage: dimension }).optional(),
    posterFrame: z.strictObject({ timestampMs: offset }).optional(),
    resize: z
      .strictObject({
        fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
        height: dimension.optional(),
        width: dimension.optional(),
        withoutEnlargement: z.boolean().optional(),
      })
      .optional(),
    rotate: z
      .strictObject({ angle: z.number() })
      .describe('Clockwise angle in degrees.')
      .optional(),
  })
  .catchall(z.unknown())
  .nullable()

/** Named built-in properties with an open set of additional transform keys. */
export const transformStateJSONSchema: NonNullable<JSONField['jsonSchema']> = {
  fileMatch: [],
  schema: z.toJSONSchema(transformStateSchema) as NonNullable<JSONField['jsonSchema']>['schema'],
  uri: 'payload://file-transform-state',
}
