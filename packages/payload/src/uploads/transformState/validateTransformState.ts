import { validateJSONSchema } from '#validateJSONSchema'

import type { Validate } from '../../fields/config/types.js'
import type { PixelCrop } from './cropUnits.js'

import { transformStateObjectSchema } from './transformStateSchema.js'

type Dimensions = { height?: null | number; width?: null | number }

/**
 * Checks `_transforms` against its schema, then checks the crop against the original's size.
 */
export async function getTransformStateError({
  original,
  value,
}: {
  original?: Dimensions | null
  value: unknown
}): Promise<string | undefined> {
  if (value === null || value === undefined) {
    return undefined
  }

  // `null` returned above, so check the object schema directly: its errors name the failing key.
  const schemaResult = await validateJSONSchema({
    jsonSchema: {
      fileMatch: ['payload://upload-transforms'],
      schema: transformStateObjectSchema,
      uri: 'payload://upload-transforms',
    },
    value,
  })

  if (schemaResult !== true) {
    return schemaResult
  }

  const crop = (value as { crop?: PixelCrop }).crop

  if (
    crop &&
    original?.width &&
    original?.height &&
    (crop.x + crop.width > original.width || crop.y + crop.height > original.height)
  ) {
    return `crop: must fit inside the original (${original.width} x ${original.height})`
  }

  return undefined
}

export const validateTransformState: Validate = async (value, { data }) =>
  (await getTransformStateError({
    original: (data as { original?: Dimensions })?.original,
    value,
  })) ?? true
