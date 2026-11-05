import { validateJSONSchema } from '#validateJSONSchema'

import type { Validate } from '../../fields/config/types.js'
import type { PixelCrop } from './cropUnits.js'

import { reservedTransformKeys, transformStateObjectSchema } from './transformStateSchema.js'

type Dimensions = { height?: null | number; width?: null | number }

/**
 * Checks `_transforms` for reserved keys and against its schema, then checks the crop against the
 * original's size.
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

  const reservedKey = reservedTransformKeys.find((key) => Object.hasOwn(value, key))

  if (reservedKey) {
    return `${reservedKey}: reserved for a built-in transform that Payload does not apply yet`
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
